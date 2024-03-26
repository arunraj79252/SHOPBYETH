const db = require("../models")
const Orders = db.orders;
const User = db.user;
const Product = db.product;
const { Failed_updating_order, Failed_updating_user } = require("./error-code.utils");
const { orderPlaced, refundCompleted, refundFailed } = require("./order-status.utils");
const { paymentSuccess, paymentFailed } = require("./payment-status.utils");
const { transactionSuccess, transactionFailed } = require("./reward-status.utils");
const notificationUtil = require('../utils/notification.util');
const Notification = db.notification;
const admin = require("firebase-admin");
const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
const errorCode = require("../utils/error-code.utils");
const { logger } = require("./logger.utils");
const orderStatusUtils = require("./order-status.utils");
const Long = require('mongodb').Long
const Web3 = require('web3');
const blockchainUtils = require('./blockchain-utils')
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });
const app = !admin.apps.length ? admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
}) : admin.app();
const updatePaymentSuccessStatus = async (orderId, userId, total, discount, totalEthereumPaid, status) => {
    let payload = {}, flag = false;
    const setUpdateBody = new Promise((resolve, reject) => {
        if (status) {
            blockchainUtils.updateUserCoinBalance(userId).then(() => {
                let orderUpdateBody = {};
                orderUpdateBody = {
                    $set: {
                        discount,
                        totalEthereumPaid,
                        paymentStatus: paymentSuccess,
                        finalPrice: total - discount,
                        'products.$[].orderStatus': orderStatusUtils.orderPlaced
                    },
                    $push: {
                        'products.$[].statusLog': [{
                            _id: 'SL' + orderPlaced + new Date().getTime().toString(),
                            orderStatus: orderPlaced,
                            user: "Server"
                        }]
                    }
                }
                flag = true;
                resolve(orderUpdateBody)
            })
        }
        else {
            orderUpdateBody = {
                $set: {
                    paymentStatus: paymentFailed,
                    'products.$[].orderStatus': orderStatusUtils.paymentFailed
                },
                $push: {
                    'products.$[].statusLog': [{
                        _id: 'SL' + paymentFailed + new Date().getTime().toString(),
                        orderStatus: paymentFailed,
                        user: "Server"
                    }]
                },
            }
            resolve(orderUpdateBody)
        }
    })
    setUpdateBody.then(updateBody => {
        Orders.updateOne({ _id: Long.fromString(orderId.toString()) }, updateBody).then(updateInfo => {
            if (updateInfo.modifiedCount > 0) {
                Orders.findOne({ _id: orderId }).then(orderRecord => {
                    let products = orderRecord.products;
                    console.log(`${orderId.toString()} - Order payment status updated successfully`)
                    if (flag) {
                        products.forEach(async element => {
                            let productId = element._id;
                            let quantity = parseInt(element.productQuantity);
                            await Product.findByIdAndUpdate(productId, { $inc: { saleCount: quantity } }).then(data => {
                            }).catch((err) => {
                                console.error("error when updating sales count.Error: " + err);
                            });
                        })
                        payload = {
                            data: {
                                title: "Order Details",
                                body: `Your Order has been Placed Successfully!`,
                                click_action: "/orderdetails/" + orderId.toString()
                            }
                        }
                    }
                    else {
                        payload = {
                            data: {
                                title: "Order Details",
                                body: notificationUtil.notificationBody[5],
                                click_action: "/orderdetails/" + orderId.toString()
                            }
                        }
                    }
                    User.findById(userId).then(userRecord => {
                        //Notification
                        const notification = new Notification({
                            orderId: orderId,
                            title: payload.data.title,
                            body: payload.data.body,
                            click_action: payload.data.click_action,
                            publicAddress: [userId],
                            deviceToken: [userRecord.deviceToken],

                        });
                        notification.save(notification)
                            .then((data) => {
                                console.log("Notification added successfully");
                            })
                            .catch((err) => {
                                console.error(`ERROR in saving notification in updatePaymentSuccessStatus. Error: ${err}`);
                            })
                        if (userRecord.deviceToken != "") {
                            app.messaging().sendToDevice(userRecord.deviceToken, payload)
                                .then(function (response) {
                                    console.log(`Successfully sent the response and  order: ${orderId.toString()} status updated to ${status}`)
                                })
                                .catch(function (error) {
                                    console.log("Error sending message:", error);
                                });
                        }
                        else {
                            console.error({ error: "Couldn't fetch device token for the user!", error_Code: errorCode.could_not_fetch_device_token })
                        }
                    })
                }).catch((error) => {
                    console.error(`Failed to update Order: ${orderId.toString()}. Error: ${error}`)
                })
            }
        })
    }).catch(() => console.log("Error while setting updateBody"))
}

const updateRewardCoinSuccessStatus = (orderId, userId, rewardCoinAmount, status) => {
    let orderUpdateBody = {}
    let userUpdateBody = {}
    let payload = {}, flag = false;
    if (status) {
        orderUpdateBody = {
            rewardStatus: transactionSuccess
        }
        userUpdateBody = {
            $inc: {
                coinBalance: rewardCoinAmount
            }
        }
        flag = true;
    }
    else {
        orderUpdateBody = {
            rewardStatus: transactionFailed
        }
    }
    updateOrder(orderId, null, orderUpdateBody).then(() => {
        blockchainUtils.updateUserCoinBalance(userId).then(() => {
            console.log(`Reward coin success status updated for userId: ${userId} and orderId: ${orderId.toString()}`)
            if (flag) {
                console.log(`Mint Coin Success and order updated. Order: ${orderId.toString()}`)
                logger.info(`Mint Coin Success and order updated. Order: ${orderId.toString()}`)
                payload = {
                    data: {
                        title: "Reward coin Status regarding Your Order",
                        body: "Your reward is successfully credited to your wallet!",
                        click_action: "/orderdetails/" + orderId.toString()
                    }
                }
            }
            else {
                payload = {
                    data: {
                        title: "Reward coin Status regarding Your Order",
                        body: "Sorry! Reward coin transaction failed. ",
                        click_action: "/orderdetails/" + orderId.toString()
                    }
                }
            }
            User.findById(userId).then(userRecord => {
                //Notification
                const notification = new Notification({
                    orderId: orderId,
                    title: payload.data.title,
                    body: payload.data.body,
                    click_action: payload.data.click_action,
                    publicAddress: [userId],
                    deviceToken: [userRecord.deviceToken],

                });
                notification.save(notification)
                    .then((data) => {
                        console.log("Saved successfully");
                    })
                    .catch((err) => {
                        console.error(`ERROR in saving notification in updateRewardCoinSuccessStatus. Error: ${err}`);
                    })
                if (userRecord.deviceToken != "") {
                    app.messaging().sendToDevice(userRecord.deviceToken, payload)
                        .then(function (response) {
                            console.log(`Successfully sent the response and  order status updated to ${status}`)
                        })
                        .catch(function (error) {
                            console.log("Error sending message:", error);
                        });
                }
                else {
                    console.error({ error: "Couldn't fetch device token for the user!", error_Code: errorCode.could_not_fetch_device_token })
                }
            })
        })
    }).catch(error => {
        console.error(`Error updating reward Coin success status for userId: ${userId} and orderId: ${orderId.toString()}. Error: ${error}`)
    })
}

const updateOrderRefundSuccessStatus = async (orderId, productId, status, userId, coinAmount) => {
    return new Promise((resolve, reject) => {
        let orderUpdateBody = {};
        let payload = {};
        if (status) {
            orderUpdateBody = {
                'products.$.orderStatus': refundCompleted,
                $push: {
                    'products.$.statusLog': [{
                        _id: 'SL' + refundCompleted + new Date().getTime().toString(),
                        orderStatus: refundCompleted,
                        user: "Server"
                    }]
                }

            }
            payload = {
                data: {
                    title: "Refund status regarding Your Order",
                    body: `Refund completed for your order #${orderId}.`,
                    click_action: "/orderdetails/" + orderId
                }
            }
        } else {
            orderUpdateBody = {
                $set: {
                    'products.$.orderStatus': refundFailed
                },
                $push: {
                    'products.$.statusLog': [{
                        _id: 'SL' + refundFailed + new Date().getTime().toString(),
                        orderStatus: refundFailed,
                        user: "Server"
                    }]
                }
            }
            payload = {
                data: {
                    title: "Refund status regarding Your Order",
                    body: `Refund got failed for your order, ${orderId}.`,
                    click_action: "/orderdetails/" + orderId
                }
            }
        }
        updateOrder(orderId, productId, orderUpdateBody).then(async () => {
            logger.info(`${orderId} - Order refund status updated successfully`)
            await blockchainUtils.updateUserCoinBalance(userId).then(async coinAmount => {
                await User.findOne({ _id: userId }).then(async userRecord => {
                    //Notification
                    const notification = new Notification({
                        orderId: orderId,
                        title: payload.data.title,
                        body: payload.data.body,
                        click_action: payload.data.click_action,
                        publicAddress: [userId],
                        deviceToken: [userRecord.deviceToken],

                    });
                    await notification.save(notification)
                        .then((data) => {
                            console.log("Saved successfully");
                            if (userRecord.deviceToken != "") {
                                app.messaging().sendToDevice(userRecord.deviceToken, payload)
                                    .then(function (response) {
                                        console.log(`Successfully sent the response and order ${orderId} status updated to ${status}`)
                                    })
                                    .catch(function (error) {
                                        console.log("Error sending message:", error);
                                    });
                            }
                            else {
                                console.error({ error: "Couldn't fetch device token for the user!", error_Code: errorCode.could_not_fetch_device_token })
                            }
                            resolve()
                        })
                        .catch((err) => {
                            console.error(`ERROR in saving notification in updateOrderRefundSuccessStatus for Order: ${orderId}.Error: ${err}`);
                            reject({ message: `ERROR in saving notification in updateOrderRefundSuccessStatus for Order: ${orderId}.Error: ${err}`, error_Code: 1000 })
                        })
                })
            })
        }).catch((error) => {
            console.error(`Failed to update Order: ${orderId}. Error: ${error}`)
        })
    })
}

function updateOrder(orderId, productId, updateBody) {
    let matchBody = { _id: Long.fromString(orderId.toString()) }
    if (productId !== null) {
        matchBody = {
            ...matchBody,
            'products._id': Long.fromString(productId.toString())
        }
    }
    return new Promise((resolve, reject) => {
        Orders.updateOne(matchBody, updateBody).then(async updateInfo => {
            if (updateInfo.modifiedCount > 0)
                resolve(await Orders.findOne({ _id: Long.fromString(orderId.toString()) }))
            else
                reject("No Order")

        }).catch((error) => {
            console.error({ error: `Failed to update product: ${productId} in order : ${orderId}`, error_Code: Failed_updating_order });
            reject(error)
        });
    })

}
function updateUser(id, updateBody) {
    return User.findByIdAndUpdate(id, updateBody).catch(() => {
        console.error({ error: "Failed to update user", error_Code: Failed_updating_user });
        return false;
    });
}

const calculateRefund = async (order, productQuantity) => {
    return new Promise((resolve, reject) => {
        let refundObject = {
            productRefundCoin: 0,
            productRefundEthereum: 0
        };
        const currentProduct = order.products
        if (productQuantity <= currentProduct.productQuantity) {
            let totalProductAmount = parseFloat((currentProduct.amount * productQuantity).toFixed(7))
            if (order.refundCoinsUsed < order.discount) {
                if ((order.discount - order.refundCoinsUsed) > totalProductAmount)
                    refundObject.productRefundCoin = totalProductAmount
                else
                    refundObject.productRefundCoin = order.discount - order.refundCoinsUsed
            }
            if (refundObject.productRefundCoin < totalProductAmount) {
                refundObject.productRefundEthereum = (Web3.utils.toWei(order.totalEthereumPaid, "ether")) * (((totalProductAmount) / order.total).toFixed(7))
            }
            resolve(refundObject)
        }
        else {
            reject({ message: "Entered product quanitity is higher than quantity in order.", errorCode: errorCode.Quantity_entered_higher_than_order_quantity })
        }
    })
}

// //Return status
// const updateReturn_status = (orderId, status) => {
//     let orderUpdateBody = {};
//     if (status) {
//         orderUpdateBody = {
//             returnStatus: 1
//         }
//     }
//     else {
//         orderUpdateBody = {
//             returnStatus: 0,
//         }
//     }
//     updateOrder(orderId, orderUpdateBody).then(() => {
//         console.log(`${orderId} - Order return status updated successfully`)
//     }).catch(() => {
//         console.log(`Failed to update Order return status: ${orderId}.`)
//     })
// }



module.exports = {
    updateRewardCoinSuccessStatus,
    updateOrderRefundSuccessStatus,
    updatePaymentSuccessStatus,
    calculateRefund
}