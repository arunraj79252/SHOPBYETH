const db = require("../models");
const { getTransactionStatus, refundAmount, validateTransactionHash, getOrderDetails, burnFrom, updateUserCoinBalance } = require("../utils/blockchain-utils");
const orderUtil = require("../utils/orders.utils");
const { paymentInitiated } = require("../utils/payment-status.utils");
const { transactionInitiated } = require("../utils/reward-status.utils");
const Orders = db.orders;
const User = db.user;
const Product = db.product;
const { mintCoin } = require('../utils/blockchain-utils');
const rewardStatusUtils = require('../utils/reward-status.utils');
const Web3 = require('web3');
const { logger } = require("../utils/logger.utils");
const orderStatus = require("../utils/order-status.utils");
const Long = require("mongodb").Long;
const Decimal128 = require("mongodb").Decimal128
const Notification = db.notification;
const notificationUtil = require('../utils/notification.util');
const admin = require("firebase-admin");
const errorCode = require("../utils/error-code.utils");
const paymentStatusUtils = require("../utils/payment-status.utils");
const app = !admin.apps.length ? admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
}) : admin.app();

module.exports = () => {
    // updateIncompleteOrders()
    // refundRetry()
    // eraseCoinBalance()
    // syncUserCoinBalance()
    // refundRetry()
    // mintRewardPoints()
    // returnPeriodChecker()
    // updateOrderTransactionStatus()

    setInterval(() => {
        updateOrderTransactionStatus()
        updateRewardTransactionStatus()
        updateRefundTransactionStatus()
        returnPeriodChecker()
        mintRewardPoints()
        refundRetry()
        // updateIncompleteOrders()
    }, 10000);

    setInterval(() => {
        updateIncompleteOrders()
    }, 5000);
}

function updateOrderTransactionStatus() {
    try {
        Orders.find({ paymentStatus: paymentInitiated, paymentTxHash: { $ne: "" } }).then(async orders => {
            if (orders.length !== 0) {
                for await (const order of orders) {
                    await getTransactionStatus(order.paymentTxHash).then(async status => {
                        logger.info(`Processing payment information for order: ${order._id.toString()}`)
                        if (status) {
                            await getOrderDetails(order._id.toString(), order.userId, order.paymentTxHash).then(orderDetails => {
                                const etherValue = Web3.utils.fromWei(orderDetails.totalEthereumPaid, 'ether');
                                orderUtil.updatePaymentSuccessStatus(order._id, order.userId, order.total, orderDetails.discount, etherValue, status);
                            }).catch(error => {
                                orderUtil.updatePaymentSuccessStatus(order._id, order.userId, order.total, 0, 0, false);
                                logger.error(`Error while fetching order details for order: ${order._id}. Error: ${error}`)
                            })
                        }
                        else {
                            orderUtil.updatePaymentSuccessStatus(order._id, order.userId, order.total, 0, 0, status);
                        }
                    }).catch(error => {
                        console.error(`(updateOrderTransactionStatus) Error for order ${order._id}. Error: ${error}`)
                    })
                };
            }
        }).catch(error => {
            console.error("Error while fetching order details in updateOrderTransactionStatus (BATCH). Error: " + error)
        })
    } catch (error) {
        console.error("Error in updateOrderTransactionStatus (BATCH). Error: " + error)
    }
}

function updateRewardTransactionStatus() {
    try {
        Orders.find({ $and: [{ rewardStatus: { $eq: rewardStatusUtils.transactionInitiated } }, { rewardTxHash: { $ne: "" } }] }).then(orders => {
            if (orders.length !== 0) {
                orders.forEach(order => {
                    getTransactionStatus(order.rewardTxHash).then(status => {
                        const rewardCoinAmount = ((Number(order.totalRewardableAmount) - order.discount) * 1 / 100)
                        orderUtil.updateRewardCoinSuccessStatus(order._id, order.userId, rewardCoinAmount, status)
                    }).catch(error => {
                        console.error(`(updateRewardTransactionStatus) Error for order ${order._id}. Error: ${error}`)
                    })
                })
            }
        })
    } catch (error) {
        console.error("Error in updateRewardTransactionStatus (BATCH). Error: " + error)
    }
}

function refundRetry() {
    try {
        Orders.aggregate([
            { $unwind: '$products' },
            { $match: { 'products.orderStatus': orderStatus.refundFailed } },
        ]).then(async orders => {
            if (orders.length !== 0) {
                let orderIndex = 0;
                while (orderIndex !== orders.length) {
                    let currentOrder = orders[orderIndex]
                    let currentProduct = currentOrder.products;
                    if (Number(currentOrder.totalEthereumPaid) > 0 || Number(currentOrder.discount > 0)) {
                        await refundAmount(currentOrder._id.toString(), currentOrder.products._id, currentOrder.userId, currentProduct.refundAmount.ethereum, currentProduct.refundAmount.rewardCoin).then(async refundTxHash => { //add product refund coin
                            let updateBody = {
                                orderStatus: orderStatus.refundInitiated,
                                refundTxHash
                            }
                            await Orders.updateOne({ _id: currentOrder._id }, { $set: updateBody }).then(async updateInfo => {
                                if (updateInfo.modifiedCount > 0) {
                                    orderIndex++
                                    console.log(`Refund retrying for order: ${currentOrder._id}`)
                                    logger.info(`Refund retrying for order: ${currentOrder._id}`)
                                }
                            })
                        })
                    }
                }
            }
        })
    }
    catch (error) {
        console.error(`Error occured in refundRetry(). Error: ${error}`)
    }
}

function updateRefundTransactionStatus() {
    try {
        Orders.aggregate([
            { $unwind: '$products' },
            { $match: { 'products.orderStatus': orderStatus.refundInitiated, 'products.refundTxHash': { $ne: "" } } },
        ]).then(async orders => {
            if (orders.length > 0) {
                let orderIndex = 0
                while (orderIndex !== orders.length) {
                    let order = orders[orderIndex]
                    let currentProduct = order.products
                    let updateProduct = new Promise(async (resolve, reject) => {
                        await getTransactionStatus(currentProduct.refundTxHash).then(async status => {
                            await orderUtil.updateOrderRefundSuccessStatus(order._id, currentProduct._id, status, order.userId, Number(currentProduct.refundAmount.rewardCoin)).then(() => {
                                resolve()
                            })
                        }).catch(error => {
                            console.error(`(updateRefundTransactionStatus) Error for product: ${currentProduct._id} in order ${order._id}. Error: ${error}`)
                            resolve()
                        })
                    })
                    await updateProduct.then(() => {
                        orderIndex++
                    })
                }
            }
        })
    } catch (error) {
        console.error("Error in updateRefundTransactionStatus (BATCH). Error: " + error)
    }
}

function returnPeriodChecker() {
    try {
        Orders.aggregate([
            { $unwind: '$products' },
            { $match: { 'products.returnDate': { $lt: new Date() }, 'products.returnStatus': 0 } }
        ]).then(async orders => {
            if (orders.length > 0) {
                for await (const order of orders) {
                    let updateBody = {
                        $inc: {
                            
                            totalRewardableAmount: new Decimal128(order.products.orderStatus === orderStatus.orderDelivered ? order.products.amount.toString() : '0')
                        },
                        $set: {
                            'products.$.returnStatus': 1
                        }
                    }
                    await Orders.updateOne({ _id: order._id, 'products._id': order.products._id }, updateBody).then(updateInfo => {
                        if (updateInfo.modifiedCount === 1) {
                            logger.info(`Return Period over for product: ${order.products._id} in order: ${order._id}`)
                        }
                        else {
                            logger.info(`Return status could not be updated for product: ${order.products._id} in order: ${order._id}`)
                        }
                    }).catch(error => {
                        logger.error(`Error updating return status for product: ${order.products._id} in order: ${order._id}. Error: ${error}`)
                    })
                }
            }
        }).catch(error => {
            logger.error(`Error in returnPeriodChecker() batch. Error: ${error}`)
        })
    } catch (error) {
        logger.error(`Error occured in returnPeriodChecker Batch function. Error: ${error}`)
        console.error(`Error occured in returnPeriodChecker Batch function. Error: ${error}`)
    }
}

// function initiateRefund

function mintRewardPoints() {
    try {
        Orders.aggregate([
            { $match: { rewardStatus: { $eq: 0 }, totalRewardableAmount: { $gt: 0 }, paymentStatus: { $eq: paymentStatusUtils.paymentSuccess }, products: { $not: { $all: [{ $elemMatch: { returnStatus: { $ne: 1 } } }] } } } }
        ]).then(async orders => {
            if (orders.length > 0) {
                let orderIndex = 0
                while (orderIndex !== orders.length) {
                    let order = orders[orderIndex]
                    if (Number(order.totalRewardableAmount) > order.discount) {
                        logger.info(`Started mint function for Order: ${order._id}`)
                        let reward = ((((Number(order.totalRewardableAmount) - order.discount) * 1) / 100))
                        await mintCoin(order._id.toString(), order.userId, reward.toFixed(6)).then(async txHash => {
                            let updateBody = {
                                rewardStatus: rewardStatusUtils.transactionInitiated,
                                rewardTxHash: txHash,
                            }
                            await Orders.updateOne({ _id: order._id }, { $set: updateBody }).then(updateInfo => {
                                if (updateInfo.modifiedCount === 1) {
                                    logger.info(`Mint Coin Success and order updated. Order: ${order._id}`)
                                    orderIndex++;
                                }
                                else {
                                    console.error(`Mint Coin Success but could not update Order: ${order._id}`)
                                    logger.error(`Mint Coin Success but could not update Order: ${order._id}`)
                                    orderIndex++;
                                }
                            }).catch(error => {
                                logger.error(`Error updating mint coin status for order: ${order._id}. Error: ${error}`)
                                console.error(`Error updating mint coin status for order: ${order._id}. Error: ${error}`)
                            })
                        }).catch(error => {
                            logger.error(`Error in mintCoin function when tried minting for order: ${order._id}. Error: ${error}`)
                            console.error(`Error in mintCoin function when tried minting for order: ${order._id}. Error: ${error}`)
                        })
                    } else {
                        await Orders.updateOne({ _id: order._id }, { $set: { rewardStatus: rewardStatusUtils.noRewardForOrder } }).then(updateInfo => {
                            if (updateInfo.modifiedCount === 1) {
                                logger.info(`No rewards to be credited for order. Order: ${order._id}`)
                                orderIndex++
                            }
                        })
                    }
                }
            }
        })
    } catch (error) {
        logger.error(`Error occured in mintRewardPoints Batch function. Error: ${error}`)
        console.error(`Error occured in mintRewardPoints Batch function. Error: ${error}`)
    }
}

function updateIncompleteOrders() {
    Orders.findOneAndUpdate({ paymentTxHash: { $eq: "" }, expiry: { $lt: Date.now() } }, { $set: { "products.$[].orderStatus": orderStatus.orderCanceled, expiry: null } }).then(async updatedOrder => {
        if (updatedOrder) {
            if (updatedOrder.products.length > 0) {
                let productsIndex = 0
                while (productsIndex !== updatedOrder.products.length) {
                    let currentProduct = updatedOrder.products[productsIndex]
                    await Product.updateOne({ _id: currentProduct._id }, { $inc: { availableStock: currentProduct.productQuantity } }).then(updateInfo => {
                        if (updateInfo.modifiedCount > 0) {
                            productsIndex++;
                            if (productsIndex === updatedOrder.products.length) {
                                console.error(`Order payment failed: ${updatedOrder._id}`)
                                logger.info(`Order payment failed: ${updatedOrder._id}`)
                            }
                        }
                    })
                }
            }
            // Send Notification
            let payload = {
                data: {
                    title: "Order Details",
                    body: notificationUtil.notificationBody[12],
                    click_action: "/orderdetails/" + updatedOrder._id.toString()
                }
            }
            User.findById(updatedOrder.userId).then(userRecord => {
                const notification = new Notification({
                    orderId: updatedOrder._id,
                    title: payload.data.title,
                    body: payload.data.body,
                    click_action: payload.data.click_action,
                    publicAddress: [updatedOrder.userId],
                    deviceToken: [userRecord.deviceToken],
                });
                notification.save(notification)
                    .then((data) => {
                        console.log("Saved successfully");
                    })
                    .catch((err) => {
                        console.error(`ERROR in saving notification in updateOrderStatus.Error: ${err}`);
                    })
                if (userRecord.deviceToken != "") {
                    app.messaging().sendToDevice(userRecord.deviceToken, payload)
                        .then(function (response) {
                            console.log(`Successfully sent the response and  order status updated to ${orderStatus.orderCanceled}`)
                        })
                        .catch(function (error) {
                            console.error("Error sending message:", error);
                        });
                }
                else {
                    console.error({ error: "Couldn't fetch device token for the user!", error_Code: errorCode.could_not_fetch_device_token })
                }
            })
        }
    })
}

function syncUserCoinBalance() {
    User.find({}).then(async user => {
        let userIndex = 0
        while (userIndex !== user.length) {
            let currentUser = user[userIndex]
            console.log("Checking for user: ", user[userIndex]._id)
            await updateUserCoinBalance(currentUser._id).then(coinBalance => {
                console.log(`User Coin Balance Sync Success for user: ${currentUser._id} Balance = ${coinBalance}`)
                userIndex++;
            }).catch(error => {
                console.error(error)
            })
            console.log("Total count = ", userIndex)
        }
    })
}

// function eraseCoinBalance() {
//     User.find({ coinBalance: { $gt: 0 } }).then(async user => {
//         let userIndex = 0
//         while (userIndex !== user.length) {
//             let currentUser = user[userIndex]
//             console.log("Started user: ", currentUser._id)
//             await burnFrom(currentUser._id, Web3.utils.toWei(currentUser.coinBalance.toString(), "ether")).then(async () => {
//                 await User.updateOne({ _id: currentUser._id }, { $set: { coinBalance: 0 } }).then(updateInfo => {
//                     if (updateInfo.modifiedCount > 0) {
//                         console.log(`Coin balance of user: ${currentUser._id} has been reset. UserCount = ${userIndex + 1}`)
//                         userIndex++
//                     }
//                 })
//             })
//         }
//     })
// }

// function deleteOrdersWithoutUser() {
//     Orders.find().then(async orders => {
//         let orderIndex = 0
//         while (orderIndex !== orders.length) {
//             let currentOrder = orders[orderIndex]
//             console.log(`Checking order: ${currentOrder._id}`)
//             await User.findOne({ _id: currentOrder.userId }).then(async user => {
//                 if (!user) {
//                     await Orders.deleteOne({ _id: currentOrder._id }).then(deleteInfo => {
//                         if (deleteInfo.deletedCount > 0)
//                             console.log(`Order: ${currentOrder._id} deleted as no user was found for the order.`)
//                     })
//                 }
//                 orderIndex++
//             })
//             console.log(`Total count : ${orderIndex}`)
//         }
//     })
// }
