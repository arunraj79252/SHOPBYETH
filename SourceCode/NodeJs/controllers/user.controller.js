const Web3 = require('web3');
const db = require("../models");
const User = db.user;
const upload = require('../middlewares/storage.middleware');
const uploadfile = upload.single('uploadImage')
const errorCode = require('../utils/error-code.utils')
const { validationResult } = require('express-validator');
const Product = db.product;
const Wishlist = db.wishlist
const Orders = db.orders;
const ChatBot = db.chatBot;
const Cart = db.cart;
const AWS = require('aws-sdk');
const awsConfig = require('../config/aws.config');
const orderStatus = require('../utils/order-status.utils')
const paymentStatus = require('../utils/payment-status.utils')
const { BadRequest, GeneralError, NotFound } = require('../utils/errors');
const { getTransactionStatus, refundAmount, validateTransactionHash } = require('../utils/blockchain-utils');
const { updatePaymentSuccessStatus, calculateRefund } = require('../utils/orders.utils');
const Notification = db.notification;
const notificationUtil = require('../utils/notification.util');
const admin = require("firebase-admin");
const { logger } = require('../utils/logger.utils');
const Long = require('mongodb').Long
const RegexEscape = require("regex-escape");
const rewardStatusUtils = require('../utils/reward-status.utils');
const app = !admin.apps.length ? admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
}) : admin.app();
let accessKeyId = process.env.accessKeyId
let secretAccessKey = process.env.secretAccessKey
let server = undefined
if (awsConfig.awsService === 'local') {
    accessKeyId = process.env.accessKeyIdLocal
    secretAccessKey = process.env.secretAccessKeyLocal
    server = process.env.s3LocalServer
}
AWS.config.update({
    region: awsConfig.region,
    credentials: {
        accessKeyId,
        secretAccessKey
    },
})
const params = {
    Bucket: awsConfig.bucket,
    MaxKeys: 1000
};
let s3 = new AWS.S3({
    endpoint: server,
    s3ForcePathStyle: true
});

//User registration
exports.registerUser = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }

    //Checking if public address is a valid address or not
    if (!Web3.utils.isAddress(req.body.publicAddress.toLowerCase())) {
        return next(new GeneralError("Invalid Public address", errorCode.Invalid_public_address));
    }

    //Json Object
    let reqBody = {
        _id: req.body.publicAddress.toLowerCase(),

    }

    //Check whether user already exist or not
    User.findOne(reqBody)
        .then(() => {
            const user = new User({
                _id: req.body.publicAddress.toLowerCase(),
                name: req.body.name,
                email: req.body.email.toLowerCase(),
                phoneNo: req.body.phoneNo,
                usertype: req.body.usertype,
                wishlistedProducts: [],
                cartProducts: [],
                status: 1
            });
            user.save(user)
                .then(() => {
                    return res.status(200).send({ message: "Registration completed successfully" })
                })
                .catch((error) => {
                    console.error("Registration Failed: " + error)
                    return next(new GeneralError("Registration failed!", errorCode.Registration_failed));
                })
        }).catch(error => {
            console.error("Error in registration. Error: ", error)
            return next(new NotFound(`Cannot find a user or user already registered`, errorCode.User_already_exists));
        });
};

exports.viewProfile = (req, res) => {
    return res.send(req.user)
}
exports.updateProfile = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const id = req.user.id
    req.body.email = req.body.email.toLowerCase()
    delete req.body.coinBalance
    delete req.body.usertype
    User.findByIdAndUpdate(id, req.body)
        .then(data => {
            return res.status(200).send({ message: "Update success!" });
        });
}

//Add items inside cart

exports.addToCartItems = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }

    const userId = req.user.id
    const products = req.body.products;
    let updateCount = 0;
    let correctedArray = [];

    products.forEach(product => {
        product.productId = Long.fromString(product.productId.toString())
        let index = correctedArray.find(res => res.productId.toString() === product.productId.toString())
        if (index) {
            index.productQuantity += product.productQuantity
        } else
            correctedArray.push(product)

    })
    for (let i in correctedArray) {
        const productId = Number(correctedArray[i].productId)
        const productQuantity = Number(correctedArray[i].productQuantity)
        const productRecord = await Product.findOne({ _id: productId, deleted: 0 })
        if (productRecord) {
            if ((productQuantity <= productRecord.availableStock && productQuantity > 0)) {
                if ((await Cart.find({ _id: userId, 'products._id': productId }).count()) === 0) {
                    const updateBody = {
                        $push: { 'products': [{ "_id": productId, "productQuantity": productQuantity }] }
                    }
                    Cart.findOneAndUpdate({ _id: userId }, updateBody, { upsert: true, new: true }).then(response => {
                        updateCount++;
                        if (updateCount == correctedArray.length) {
                            res.status(200).send({ message: "Added to cart" })
                        }
                    })
                        .catch(error => {
                            console.error(`Error adding product ${productId} into Cart for user: ${userId}. Error: ${error}`);
                            return next(new BadRequest("Error while adding products into Cart.", errorCode.Failed_to_addCartItems))
                        })
                }
                else {
                    Cart.updateOne(
                        { _id: userId, "products._id": productId },
                        {
                            $set:
                                { "products.$[elem]": { "_id": productId, "productQuantity": productQuantity } },
                        },
                        { arrayFilters: [{ "elem._id": productId }] }


                    ).then((response) => {
                        updateCount++;

                        if (updateCount == correctedArray.length) {
                            res.status(200).send({ message: "Added to cart" })
                        }
                    })
                        .catch(error => {
                            console.error("Error occured while updating products inside cart:", error)
                            return next(new BadRequest("Error occured while updating products inside cart:", errorCode.Failed_to_updateCartItems))
                        })
                }
            }
            else {
                return next(new BadRequest(`Product out of stock , as available stock is ${productRecord.availableStock} for productId ${productId}`, errorCode.Product_out_of_stock));
            }
        }
        else {
            return next(new BadRequest(`Invalid product Id  ${productId}`, errorCode.Invalid_product_id))
        }
    }
}

//Delete Cart Items
exports.deleteCart = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        next(new BadRequest({ message: errors.errors[0].msg }));

    }

    const userId = req.user.id
    const productId = Long.fromString(req.params.productId.toString())
    const productRecord = await Product.findOne({ _id: productId })
    const cartRecord = await Cart.findOne({ _id: userId, 'products._id': productId })
    if (productRecord) {
        if (cartRecord) {
            const updateBody = {
                $pull: { 'products': { _id: productId } }
            }
            Cart.findByIdAndUpdate(userId, updateBody).then(response => {
                res.status(200).send({ message: "Successfully removed product from cart" })
            })
                .catch(error => {
                    console.error("Error occured while deleting product from cart: ", error)
                    return next(new GeneralError("Error occurred while deleting product from cart", errorCode.Failed_to_deleteItems_from_cart))
                })
        }
        else {
            return next(new BadRequest('Product does not exist inside cart', errorCode.Product_not_in_cart))
        }
    }
    else {
        return next(new BadRequest('Invalid Product Id.', errorCode.Invalid_product_id))
    }
}

exports.findCart = (req, res, next) => {
    const userId = req.user.id
    let checkQuantity = []
    Cart.find({ _id: userId }, 'products -_id').then(cart => {
        if (cart !== []) {
            if (Number(cart) === 0 || cart[0].products.length === 0) {
                return res.status(200).send([])
            }
            else {
                let productIds = []
                cart[0].products.forEach(element => {
                    productIds.push(element._id)
                    checkQuantity.push({
                        _id: element._id, quantity:
                            element.productQuantity, addedDate: element.addedDate
                    })
                });
                Product.find({ _id: { $in: productIds }, deleted: 0 }, 'productName description price coverImage availableStock').lean().then(cartProducts => {
                    if (cartProducts.length > 0) {
                        let index = 0;
                        let wishlistLoop = new Promise(async (resolve, reject) => {
                            while (index !== cartProducts.length) {

                                for (const element of checkQuantity) {
                                    if (element._id == cartProducts[index]._id)
                                        cartProducts[index].quantity = element.quantity

                                    cartProducts[index].addedDate = element.addedDate
                                }

                                await Wishlist.findOne({
                                    _id: req.user.id, products: {
                                        $elemMatch: { productId: cartProducts[index]._id }
                                    }
                                }).count().then(cartCount => {
                                    if (cartCount > 0)
                                        cartProducts[index].isInWishlist = true
                                    else
                                        cartProducts[index].isInWishlist = false
                                    if (index === cartProducts.length - 1) {
                                        resolve()
                                    }
                                })
                                index++
                            }
                        })
                        wishlistLoop.then(() => {
                            return res.send(cartProducts)
                        })
                    }
                    else {
                        return res.status(200).send([])
                    }
                })
            }
        }
        else {
            return res.status(200).send([])
        }
    }).catch(error => {
        console.error("Failed ", error)
        return next(new BadRequest("Error while fetching Cart",
            errorCode.Failed_to_fetch_cartItems))
    })
}


exports.getProductDetail = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    try {
        const id = Long.fromString(req.params.id.toString());
        let projection = {
            productName: 1,
            description: 1,
            price: 1,
            originalPrice: 1,
            categoryId: 1,
            subCategoryId: 1,
            brandId: 1,
            typeId: 1,
            gender: 1,
            availableStock: 1,
            coverImage: 1,
            productImages: 1,
            createdAt: 1,
            updatedAt: 1,
            specifications: 1,
            viewCount: 1,
            feedback: 1,
            'averageRating': { $avg: '$feedback.rating' },
            'ratingCount': { $size: '$feedback' }
        }
        Product.findOne({ _id: id, deleted: 0 }, projection).lean().then(product => {
            if (product) {
                product._id = product._id.toString()
                Wishlist.findOne({ _id: req.user.id, products: { $elemMatch: { productId: id } } }).count().then(wishlistCount => {
                    Cart.findOne({ _id: req.user.id, products: { $elemMatch: { _id: id } } }).count().then(cartCount => {
                        Orders.findOne({ userId: req.user.id, products: { $elemMatch: { _id: id, statusLog: { $elemMatch: { orderStatus: orderStatus.orderDelivered } } } } }).count().then(orderCount => {
                            if (wishlistCount > 0) {
                                product.isWishlisted = true
                            }
                            else { product.isWishlisted = false }
                            if (cartCount > 0) {
                                product.isInCart = true
                            } else { product.isInCart = false }
                            if (orderCount > 0) {
                                product.hasBought = true
                            } else { product.hasBought = false }
                            let index = 1;
                            let flag = 0;
                            let feedbackLoop = new Promise((resolve, reject) => {
                                let ratingInfo = {
                                    fiveStar: 0,
                                    fourStar: 0,
                                    threeStar: 0,
                                    twoStar: 0,
                                    oneStar: 0
                                }
                                if (product.feedback.length > 0) {
                                    product.feedback.forEach(async (feedback) => {
                                        if (feedback) {
                                            switch (feedback.rating) {
                                                case 5:
                                                    ratingInfo.fiveStar++
                                                    break;
                                                case 4:
                                                    ratingInfo.fourStar++
                                                    break;
                                                case 3:
                                                    ratingInfo.threeStar++
                                                    break;
                                                case 2:
                                                    ratingInfo.twoStar++
                                                    break;
                                                case 1:
                                                    ratingInfo.oneStar++
                                                    break;
                                                default: break;
                                            }


                                            if (feedback.userId === req.user.id) {
                                                flag = 1;
                                                product.hasRated = true;
                                                product.userFeedbackId = feedback._id
                                            }
                                            User.findOne({ _id: feedback.userId }, 'name -_id').then(user => {
                                                if (user)
                                                    feedback.username = user.name;
                                                if (index === product.feedback.length) {
                                                    product = { ...product, ...ratingInfo }
                                                    resolve();
                                                }
                                                else index++
                                            })
                                        }
                                    })
                                } else resolve();
                            });
                            feedbackLoop.then(() => {
                                if (flag === 0) {
                                    product.hasRated = false;
                                    product.userFeedbackId = "";
                                }
                                Product.updateOne({ _id: id }, { $inc: { viewCount: 1 } }).then(() => {
                                    return res.status(200).send(product)
                                })
                            });
                        })
                    })
                })
            }
            else {
                return next(new BadRequest("Product not available.", errorCode.Product_not_available))
            }
        }).catch(error => {
            console.error("Error while getting product detail. Error: ", error)
            return next(new BadRequest("Error while fetching product.", errorCode.Failed_fetching_product))
        })
    } catch (error) {
        console.error("Error : ", error)
        return next(new BadRequest("Error while fetching products.", errorCode.Failed_fetching_product))
    }
}

exports.getProducts = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    try {

        let { page, size, views, sales, createdAt, avgRating, rating, brand, gender, price, category, subCategory, keyword, priceRange, typeId, outOfStock } = req.query
        if (!page) { page = 1 }


        let limit = size ? Number(size) : 10;
        let sortParams = {}
        let matchParams = { deleted: 0 }
        if (views) {
            sortParams.viewCount = Number(views)
        }
        else if (sales) {
            sortParams.saleCount = Number(sales)
        }
        else if (price) {
            sortParams.price = Number(price)
        }
        else if (createdAt) {
            sortParams.createdAt = Number(createdAt)
        }
        else if (avgRating) {
            sortParams = { 'feedback.rating': Number(avgRating) }
        }
        if (gender) {
            gender = gender.replaceAll(' ', '');
            let genders = gender.split(',')
            let genderNum = genders.map(Number)
            if (genderNum.includes(3) || genderNum.includes(4))
                genderNum.push(5)
            if (genderNum.includes(1) || genderNum.includes(2))
                genderNum.push(0)
            matchParams.gender = { $in: genderNum }
        }
        if (rating) {
            matchParams.$expr = { $gte: [{ $avg: '$feedback.rating' }, Number(rating)] }
        }
        if (brand) {
            brand = brand.replaceAll(' ', '');
            let brands = brand.split(',')
            matchParams.brandId = { $in: brands }
        }
        if (outOfStock) {
            if (Number(outOfStock) === 1)
                matchParams.availableStock = { $eq: 0 }
            else if (Number(outOfStock) === 0)
                matchParams.availableStock = { $gt: 0 }
        }
        if (keyword) {
            matchParams.$or = [
                { "productName": { $regex: RegexEscape(keyword), $options: 'i' } },
            ]
        }
        if (priceRange) {
            let range = priceRange.split(',')
            matchParams.$and = [
                { price: { $gte: Number(range[0]) } },
                { price: { $lte: Number(range[1]) } }
            ]
        }
        if (category) {
            matchParams.categoryId = category
            if (subCategory) {
                let subcat = subCategory.replaceAll(' ', '');
                let subcategories = subcat.split(",")
                matchParams.subCategoryId = { $in: subcategories }
                if (typeId) {
                    typeId = typeId.replaceAll(' ', '');
                    let types = typeId.split(',')
                    matchParams.typeId = { $in: types }
                }
            }
        }
        let projection = {
            productName: 1,
            price: 1,
            originalPrice: 1,
            categoryId: 1,
            subCategoryId: 1,
            brandId: 1,
            typeId: 1,
            availableStock: 1,
            coverImage: 1,
            viewCount: 1,
            saleCount: 1,
            createdAt: 1,
            gender: 1,
            'averageRating': { $avg: '$feedback.rating' },
            'ratingCount': { $size: '$feedback' }
        }
        Product.paginate(matchParams, { page, limit, projection, sort: sortParams, collation: { locale: 'en', strength: 2 }, lean: true })
            .then(result => {
                if (result.docs.length >= 1) {
                    let checking = new Promise((resolve) => {
                        let index = 0;
                        if (result.totalDocs > 0) {
                            result.docs.forEach((element) => {
                                Wishlist.findOne({ _id: req.user.id, products: { $elemMatch: { productId: element._id } } }).count().then(wishlistCount => {
                                    Cart.findOne({ _id: req.user.id, products: { $elemMatch: { _id: element._id } } }).count().then(cartCount => {
                                        if (wishlistCount > 0) {
                                            element.isWishlisted = true
                                        }
                                        else { element.isWishlisted = false }
                                        if (cartCount > 0) {
                                            element.isInCart = true
                                        } else { element.isInCart = false }
                                        if (index === result.docs.length - 1) resolve();
                                        index++;
                                    })
                                })
                            })
                        }
                        else {
                            resolve();
                        }
                    });
                    checking.then(() => {
                        return res.send(result)
                    })
                }
                else {
                    return res.send(result)
                }
            }).catch(error => {
                console.error({ Error: "Error while fetching products. Error: ", error })
                return next(new BadRequest("Error while fetching products.", errorCode.Failed_fetching_product));
            })

    } catch (error) {
        console.error("Error : ", error)
        return next(new BadRequest("Error while fetching products.", errorCode.Failed_fetching_product))
    }
}

exports.createOrder = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const userId = req.user.id
    const products = req.body.products
    const deliveryAddressId = req.body.deliveryAddressId.toString()
    const orderId = Long.fromString(Math.floor(Math.random() * 1000).toString() + new Date().getTime().toString());
    let modifiedProducts = [];
    let stockReductionIndex = 0
    let totalOrderAmount = 0;
    let stockReduction = new Promise(async (resolve, reject) => {
        while (stockReductionIndex !== products.length) {
            // console.log(stockReductionIndex, products.length)
            let currentProduct = products[stockReductionIndex]
            currentProduct._id = Long.fromString(currentProduct._id.toString())
            await Product.updateOne({ _id: currentProduct._id, availableStock: { $gte: currentProduct.productQuantity }, price: currentProduct.amount }, { $inc: { availableStock: -currentProduct.productQuantity } }).then(updateInfo => {
                if (updateInfo.modifiedCount !== 1) {
                    stockReductionIndex = products.length
                    reject()
                }
                else {
                    let currentOrderAmount = (currentProduct.amount * 1000) * (currentProduct.productQuantity * 1000) / 1000000
                    totalOrderAmount = parseFloat((((totalOrderAmount * 10000) + (currentOrderAmount * 10000)) / 10000).toFixed(7))
                    stockReductionIndex++
                    modifiedProducts.push({ _id: currentProduct._id, modifiedStock: currentProduct.productQuantity })
                    if (stockReductionIndex === products.length) {
                        resolve()
                    }
                }
            })
        }
    })
    stockReduction.then(() => {
        let correctedArray = []
        products.forEach(product => {
            let index = correctedArray.find(res => res._id.toString() === product._id.toString())
            if (index)
                index.productQuantity += product.productQuantity
            else
                correctedArray.push(product)
        })
        User.aggregate([
            { $match: { _id: req.user.id } },
            { $unwind: '$address' },
            { $match: { 'address._id': deliveryAddressId } },
        ]).then(userDetail => {
            if (userDetail.length > 0) {
                const order = new Orders({
                    _id: orderId,
                    userId,
                    deliveryAddress: userDetail[0].address,
                    products: correctedArray,
                    total: totalOrderAmount,
                    expiry: new Date(Date.now() + (1200000)) //20-minutes
                });
                order.save().then(() => {
                    //Notification
                    let payload = {
                        data: {
                            title: "Order Details",
                            body: notificationUtil.notificationBody[0],
                            click_action: "/orderdetails/" + orderId.toString()
                        }
                    }
                    User.findById(userId).then(userRecord => {
                        const notification = new Notification({
                            orderId,
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
                                console.error(`ERROR in saving notification in placeOrder.Error: ${err}`);
                            })
                        if (userRecord.deviceToken != "") {
                            app.messaging().sendToDevice(userRecord.deviceToken, payload)
                                .then(function (response) {
                                    console.log(`Successfully sent the response and order: ${orderId.toString()} created!`)
                                })
                                .catch(function (error) {
                                    console.log("Error sending message:", error);
                                });
                        }
                        else {
                            console.error({ error: "Couldn't fetch device token for the user!", error_Code: errorCode.could_not_fetch_device_token })
                        }
                    })
                    logger.info(`Order Created: ${orderId.toString()}`)
                    return res.send({ message: "Order Created", orderId: orderId.toString() })
                })
            }
            else {
                console.error("Delivery Address not found for Id: ", deliveryAddressId)
                return next(new BadRequest("Delivery address not found for the current user.", errorCode.Delivery_address_not_found))
            }
        })
    }).catch(() => {
        let stockRevert = new Promise(async (resolve, reject) => {
            let stockRevertIndex = 0
            while (stockRevertIndex === modifiedProducts.length - 1) {
                let currentModifiedProduct = modifiedProducts[stockRevertIndex]
                await Product.updateOne({ _id: currentModifiedProduct._id }, { $set: { $inc: { availableStock: currentModifiedProduct.stock } } }).catch(error => {
                    reject(`Error occured while reverting stock for product: ${currentModifiedProduct._id}. Error: ${error}`)
                })
                stockRevertIndex++
                if (stockRevertIndex === modifiedProducts.length) {
                    resolve()
                }
            }
        })
        if (modifiedProducts.length > 0) {
            stockRevert.then(() => {
                logger.error(`One or more products were out of stock or had a change in price.: ${JSON.stringify(modifiedProducts)}`)
                return next(new BadRequest("One or more products were out of stock or had a change in price.", errorCode.Product_price_stock_or_price_changed))
            }).catch(error => {
                logger.error(`Error during stock updation. Error: ${error}`)
                return next(new BadRequest("Error occured during stock updation.", errorCode.Error_occured_during_stock_updation))
            })
        }
        else {
            return next(new BadRequest("One or more products were out of stock or had a change in price.", errorCode.Product_price_stock_or_price_changed))
        }
    })
}

exports.completeOrder = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const userId = req.user.id;
    let { orderId, paymentTxHash } = req.body;
    let isFromCart = req.body.isFromCart ? req.body.isFromCart : false;
    orderId = Long.fromString(orderId.toString())
    validateTransactionHash(paymentTxHash, userId).then(() => {
        let updateBody = {
            paymentTxHash,
            expiry: null,
            paymentStatus: paymentStatus.paymentInitiated
        }
        Orders.updateOne({ _id: orderId, userId }, { $set: updateBody }).then(updateInfo => {
            if (updateInfo.modifiedCount > 0) {

                let clearCart = new Promise((resolve, reject) => {
                    if (isFromCart === true) {
                        Cart.deleteOne({ _id: userId }).then(() => resolve())
                    }
                    else { resolve() }
                })
                clearCart.then(() => {
                    logger.info(`Order Completed: ${orderId.toString()}`)
                    return res.send({ message: "Order created successfully." })
                })
            }
            else {
                return next(new BadRequest("No orderId for current user.", errorCode.OrderId_not_found_for_user))
            }
        })
    }).catch(error => {
        return next(new BadRequest(error.message, error.errorCode))
    })
}


exports.addToWishlist = async (req, res, next) => {
    try {
        const userId = req.user.id
        let productId = Long.fromString(req.body.productId.toString())
        if (await Product.findOne({ _id: productId, deleted: 0 })) {
            if ((await Wishlist.find({ _id: userId, 'products.productId': productId }).count()) === 0) {
                let updateBody = {
                    $push: { 'products': [{ productId: productId }] }
                }
                Wishlist.findOneAndUpdate({ _id: userId }, updateBody, { upsert: true, new: true }).then(() => {
                    User.updateOne({ _id: userId }, { $push: { wishlistedProducts: productId } }, { upsert: true, new: true })
                    return res.status(200).send({ message: "product added to wishlist successfully!" })
                })
                    .catch(error => {
                        console.error(`Error adding product ${productId} to wishlist for user: ${userId}. Error: ${error}`)
                        return next(new BadRequest("Error adding product to wishlist.", errorCode.Error_adding_product_to_wishlist))
                    })
            }
            else {
                return next(new BadRequest('Product already exists in wishlist', errorCode.Product_already_exists_in_wishlist))
            }
        } else {
            return next(new BadRequest("Product not available.", errorCode.Invalid_product_id))
        }
    } catch (error) {
        console.error("Error in addToWishlist(). Error: ", error)
        return next(new GeneralError("An unexpected error occurred.", errorCode.Unexpected_error))
    }
}

exports.removeFromWishlist = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    try {
        const userId = req.user.id
        let productId = Long.fromString(req.params.id.toString())
        let updateBody = {
            $pull: { products: { productId } }
        }
        Wishlist.updateOne({ _id: userId }, updateBody).then(response => {
            User.updateOne({ _id: userId }, { $pull: { wishlistedProducts: productId } })
            res.status(200).send({ message: "product removed from wishlist successfully!" })
        })
            .catch(error => {
                console.error(`Error removing product ${productId} from wishlist for user: ${userId}`)
                return next(new BadRequest("Error removing product from wishlist.", errorCode.Error_deleting_product_from_wislist))
            })
    } catch (error) {
        console.error("Error in removeFromWishlist(). Error: ", error)
        return next(new GeneralError("An unexpected error ocured.", errorCode.Unexpected_error))
    }
}

exports.viewWislist = (req, res, next) => {
    const userId = req.user.id
    Wishlist.find({ _id: userId }, 'products -_id').then(wishlist => {
        if (wishlist !== []) {
            if (Number(wishlist) === 0 || wishlist[0].products.length === 0) {
                return res.status(200).send({
                    message: "Wishlist is empty."
                })
            }
            else {
                let productIds = []
                wishlist[0].products.forEach(element => {
                    productIds.push(element.productId)
                });
                Product.find({ _id: { $in: productIds }, deleted: 0 }, 'productName description price coverImage availableStock ').lean().then(wishlistProducts => {
                    if (wishlistProducts.length > 0) {
                        let index = 0;
                        let cartLoop = new Promise(async (resolve, reject) => {
                            while (index !== wishlistProducts.length) {
                                await Cart.findOne({ _id: req.user.id, products: { $elemMatch: { _id: wishlistProducts[index]._id } } }).count().then(cartCount => {
                                    if (cartCount > 0)
                                        wishlistProducts[index].isInCart = true
                                    else
                                        wishlistProducts[index].isInCart = false
                                    if (index === wishlistProducts.length - 1) {
                                        resolve()
                                    }
                                })
                                index++
                            }
                        })
                        cartLoop.then(() => {
                            return res.send(wishlistProducts)
                        })
                    }
                    else {
                        return res.status(200).send({
                            message: "Wishlist is empty."
                        })
                    }
                })
            }
        }
        else {
            return res.status(200).send({
                message: "Wishlist is empty."
            })
        }
    }).catch(error => {
        console.error("Error while fetching wishlist. Error: ", error)
        return next(new BadRequest("Error while fetching wishlist", errorCode.Failed_fetching_wishlist))
    })
}

exports.getCounts = async (req, res, next) => {
    let counts = {}
    try {
        const userId = req.user.id
        const getCartCount = new Promise((resolve, reject) => {
            cartProducts = []
            Cart.findOne({ _id: userId }).lean().then(data => {
                if (data) {
                    data.products.forEach(product => {
                        cartProducts.push(Long.fromString(product._id.toString()))
                    })
                    Product.find({ _id: { $in: cartProducts }, deleted: 0 }).count().then(cartCount => {
                        resolve(cartCount)
                    })
                }
                else
                    resolve(0)
            }).catch(error => {
                reject({ message: error, errorCode: errorCode.Error_fetching_cart_counts })
            })
        })
        const getWishlistCount = new Promise((resolve, reject) => {
            wishlistProducts = []
            Wishlist.findOne({ _id: userId }).lean().then(data => {
                if (data) {
                    data.products.forEach(product => {
                        wishlistProducts.push(Long.fromString(product.productId.toString()))
                    })
                    Product.find({ _id: { $in: wishlistProducts }, deleted: 0 }).count().then(wishlistCount => {
                        resolve(wishlistCount)
                    })
                }
                else
                    resolve(0)
            }).catch(error => {
                reject({ message: error, errorCode: errorCode.Error_fetching_wishlist_counts })
            })
        })
        getCartCount.then(cartCount => {
            getWishlistCount.then(wishlistCount => {
                counts.cartCount = cartCount
                counts.wishlistCount = wishlistCount
                return res.send(counts)
            }).catch(error => {
                return next(new BadRequest("Error fetching wishlist count.", error.errorCode))
            })
        }).catch(error => {
            return next(new BadRequest("Error fetching cart count.", error.errorCode))
        })
    } catch (error) {
        console.error("Error while fetching counts. Error: ", error)
        return next(new GeneralError("Error while fetching counts.", errorCode.Error_while_fetching_counts));
    }
}

exports.viewOrders = async (req, res, next) => {
    const userId = req.user.id;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    let { page, size, createdate, orderstatus } = req.query
    let limit = size ? Number(size) : 10;
    let pageNumber = page ? Number(page) : 1;
    let sortParams = {}
    let matchParams = {}
    let docs = {}
    let result = {}
    let totaldocs = 0
    let totalpages = 0
    let orderfilter = orderstatus
    let createdat = createdate ? Number(createdate) : -1;
    let skipValue = (pageNumber - 1) * limit
    matchParams.userId = userId
    sortParams.createdAt = Number(createdat)
    if (orderstatus) {
        let queryArray = orderfilter.split(",")
        let numberArray = queryArray.map(Number);
        matchParams.orderStatus = { $in: numberArray }
    }
    await Orders.aggregate([
        {
            $unwind: {
                path: '$userId'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        },
        {
            $unwind: {
                path: '$user'
            }
        },
        {
            $unwind: {
                path: '$products'
            }
        },
        {
            $lookup: {
                from: 'products',
                localField: 'products._id',
                foreignField: '_id',
                as: 'products.product'


            }
        },
        {
            $unwind: {
                path: '$products.product'
            }
        },
        {
            $group: {
                _id: '$_id',
                userId: { $first: '$userId' },
                userName: { $first: '$user.name' },
                total: { $first: '$total' },
                discount: { $first: '$discount' },
                paymentTxHash: { $first: '$paymentTxHash' },
                rewardTxHash: { $first: '$rewardTxHash' },
                products: {
                    $push: {
                        _id: "$products._id",
                        productName: "$products.product.productName",
                        quantity: "$products.productQuantity",
                        amount: "$products.amount",
                        coverImage: "$products.product.coverImage",
                        addedDate: "$products.addedDate"
                    }
                },
                orderStatus: { $first: '$orderStatus' },
                paymentStatus: { $first: '$paymentStatus' },
                rewardStatus: { $first: '$rewardStatus' },
                deliveryAddress: { $first: '$deliveryAddress' },
                statusLog: { $first: '$statusLog' },
                createdAt: { $first: '$createdAt' },
                updatedAt: { $first: '$updatedAt' }
            },
        },
        { $match: matchParams },
        { $sort: sortParams },
        {
            $facet: {
                docs: [
                    {
                        $project: {
                            _id: 1,
                            userId: 1,
                            userName: 1,
                            products: 1,
                            total: 1,
                            discount: 1,
                            paymentTxHash: 1,
                            rewardTxHash: 1,
                            orderStatus: 1,
                            paymentStatus: 1,
                            rewardStatus: 1,
                            deliveryAddress: 1,
                            statusLog: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        }
                    },
                    { $skip: skipValue },
                    { $limit: limit },
                ],
                pagination: [
                    { $count: "totalDocs" },
                    { $addFields: { page: pageNumber } },

                ]
            }
        }
    ]).then(record => {
        docs = record[0].docs;
        if (docs.length === 0) {
            docs = []
            result = { docs, totalPages: 0 }
        }
        else {
            docs.forEach(order => {
                order._id = order._id.toString()
            })
            totaldocs = record[0].pagination[0].totalDocs
            totalpages = Math.ceil(totaldocs / limit)
            result = { docs, page: pageNumber, docsInPage: docs.length, totalPages: totalpages, totalDocs: totaldocs }
        }
        res.send(result)
    }).catch(error => {
        return next(new BadRequest(`Error while fetching orders`, errorCode.Failed_fetching_orders))
    })
}


exports.viewOrderDetails = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const id = Long.fromString(req.params.id.toString());
    Orders.find({ _id: id })
        .lean().then(orders => {
            if (orders.length === 0) {
                return next(new BadRequest(`OrderId Not Found `, errorCode.Invalid_OrderId))
            }
            //  else{
            orders.forEach(element => {
                element._id = element._id.toString()
                User.findOne({ _id: element.userId }).then(user => {
                    element.username = user.name;
                })
                let loop = new Promise((resolve, reject) => {
                    let index = 1;
                    if (String(typeof (element.products)) != "undefined") {
                        if (orders[0].products.length > 0) {
                            orders[0].products.forEach(product => {
                                Product.findOne({ _id: product._id }).then(productData => {
                                    if (productData != null) {
                                        product.coverImage = productData.coverImage;
                                        product.productName = productData.productName;
                                        product.deleted = productData.deleted
                                        product.availableStock = productData.availableStock
                                    }
                                    if (index === orders[0].products.length)
                                        resolve()
                                    else index++;
                                })
                            })
                        }
                    }
                })
                loop.then(() => {
                    return res.send(orders)
                })
            })
            //   }   
        }).catch(error => {
            return next(new BadRequest(`Error while fetching orders:${error}`, errorCode.Failed_fetching_orders))
        })
}

exports.checkPaymentTransactionStatus = (req, res, next) => {
    const orderId = Long.fromString(req.params.id.toString())
    Orders.findOne({ _id: orderId }).then(order => {
        if (order !== undefined) {
            getTransactionStatus(order.paymentTxHash).then(status => {
                updatePaymentSuccessStatus(orderId, status)
            })
        } else {
            return next(new BadRequest("Invalid Order Id.", errorCode.Invalid_order_Id))
        }
    })
}

//Cancel order
exports.cancelProduct = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const orderId = Long.fromString(req.params.id.toString())
    const productId = Long.fromString(req.query.productId.toString())
    const userId = req.user.id
    let updateBody = {}
    let statusArray;
    Orders.aggregate([
        { $match: { _id: orderId, userId } },
        { $unwind: '$products' },
        { $match: { 'products._id': productId } },
    ]).then(orderRecords => {
        if (orderRecords.length != 0) {
            const orderRecord = orderRecords[0]
            const currentProduct = orderRecord.products;
            statusArray = Array.from(currentProduct.statusLog.map(x => x.orderStatus));
            let payload = {
                data: {
                    title: "Order Details",
                    body: orderRecord.totalEthereumPaid > 0 && !statusArray.includes(orderStatus.refundCompleted) ? notificationUtil.notificationBody[6] : notificationUtil.notificationBody[13],
                    click_action: "/orderdetails/" + orderId.toString()
                }
            }
            let refund = new Promise(async (resolve, reject) => {
                if (currentProduct.orderStatus >= orderStatus.orderPlaced && currentProduct.orderStatus <= orderStatus.orderShipped) {
                    let cancelUpdateBody = {
                        $set: {
                            'products.$.orderStatus': orderStatus.orderCanceled,
                            'products.$.returnStatus': 1
                        },
                        $push: {
                            'products.$.statusLog': [{
                                _id: 'SL' + orderStatus.orderCanceled + new Date().getTime().toString(),
                                orderStatus: orderStatus.orderCanceled,
                                user: "User"
                            }]
                        }
                    }
                    if ((Number(orderRecord.totalEthereumPaid) > 0 || orderRecord.discount > 0) && !statusArray.includes(orderStatus.refundCompleted)) {
                        calculateRefund(orderRecord, currentProduct.productQuantity).then(refundObject => {
                            refundAmount(orderRecord._id, currentProduct._id, orderRecord.userId, refundObject.productRefundEthereum, refundObject.productRefundCoin).then(async refundTxHash => {
                                await Orders.updateOne({ _id: orderId, 'products._id': productId }, cancelUpdateBody).then(updateInfo => {
                                    if (updateInfo.modifiedCount > 0) {
                                        updateBody = {
                                            $set: {
                                                'products.$.orderStatus': orderStatus.refundInitiated,
                                                'products.$.refundTxHash': refundTxHash,
                                                'products.$.refundAmount.ethereum': refundObject.productRefundEthereum,
                                                'products.$.refundAmount.rewardCoin': refundObject.productRefundCoin
                                            },
                                            $push: {
                                                'products.$.statusLog': [{
                                                    _id: 'SL' + orderStatus.refundInitiated + new Date().getTime().toString(),
                                                    orderStatus: orderStatus.refundInitiated,
                                                    user: "Server"
                                                }]
                                            },
                                            $inc: {
                                                refundCoinsUsed: refundObject.productRefundCoin
                                            }
                                        }
                                        resolve();
                                    }
                                })
                            }).catch(error => {
                                console.error(`Error in refund amount function for orderId: ${orderId.toString()}. Error: ${JSON.stringify(error)}`)
                                reject(error);
                                return next(new BadRequest("Error in refundAmount.", errorCode.Error_in_refund_process))
                            })
                        })
                    }
                    else {
                        await Orders.updateOne({ _id: orderId, 'products._id': productId }, cancelUpdateBody) //correction required
                        resolve()
                    }

                }
                else if (currentProduct.orderStatus === orderStatus.waitingForPaymentConfirmation) {
                    return next(new BadRequest("Order payment in pending status. Please try again after sometime.", errorCode.Payment_in_pending_state))
                }
                else {
                    return next(new BadRequest("Order cannot be canceled at this Order Status.", errorCode.Order_cannot_be_cancelled))
                }
            })
            refund.then(() => {
                Orders.updateOne({ _id: orderId, 'products._id': currentProduct._id }, updateBody).then(async (data) => {
                    let statusNotAllowed = [5, 7, 6];
                    if (statusNotAllowed.some(i => statusArray.includes(i))) {
                        console.log("Sale count can't update as Order was already in cancel or return completed stage!");
                    }
                    else {
                        await Product.findByIdAndUpdate(productId, { $inc: { saleCount: -currentProduct.productQuantity, availableStock: currentProduct.productQuantity } }).then(data => {
                        }).catch((err) => {
                            console.error("error when updating sales count.Error: " + err);
                        });
                    }
                    User.findById(userId).then(userRecord => {
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
                                console.error(`ERROR in saving notification in cancel order.Error: ${err}`);
                            })

                        if (userRecord.deviceToken != "") {
                            app.messaging().sendToDevice(userRecord.deviceToken, payload)
                                .then(function (response) {
                                    console.log(`Successfully sent the response and  order canceled!`)
                                })
                                .catch(function (error) {
                                    console.log("Error sending message:", error);
                                });

                        }
                        else {
                            console.error({ error: "Couldn't fetch device token for the user!", error_Code: errorCode.could_not_fetch_device_token })
                        }
                    })
                    return res.send({
                        message:
                            "Order sucessfully cancelled."
                    });
                }).catch((error) => {
                    console.error("Failed to cancel order. Error: ", error)
                    return next(new BadRequest(`Error while cancelling order. Error: ${error}`, errorCode.Failed_to_Cancel_Order))
                })
            }).catch(error => {
                console.error(`Error in refund promise for order: ${orderId.toString()}. Error: ${error}`)
                return next(new GeneralError("Error in inititating Refund. Please try again later", errorCode.Error_in_refund_process))
            })
        }
        else {
            return next(new BadRequest("Order Id and product Id combination does not exist for userId.", errorCode.Invalid_OrderId))
        }
    })
}

exports.getRewardCoinHistory = (req, res, next) => {
    const userId = req.user.id;
    let response = []
    let getRewardCoinData = new Promise(async (resolve, reject) => {
        Orders.find({ userId }).lean().then(async orders => {
            if (orders.length > 1) {
                let orderIndex = 0
                while (orderIndex !== orders.length) {
                    let order = orders[orderIndex]
                    let productIndex = 0
                    let products = []
                    let getProductData = new Promise(async (resolve, reject) => {
                        while (productIndex !== order.products.length) {
                            await Product.findOne({ _id: order.products[productIndex]._id }).then(record => {
                                products.push({
                                    productId: record._id.toString(),
                                    productName: record.productName
                                })
                                productIndex++
                                if (productIndex === order.products.length) {
                                    resolve()
                                }
                            }).catch(error => {
                                console.error(`Error while fetching product details in admin getUserRewardCoinHistory. Error: ${error}`)
                                resolve();
                            })
                        }
                    })
                    await getProductData.then(() => {
                        let coinsEarned = ((Number(order.totalRewardableAmount) - order.discount) * 1 / 100)
                        if (coinsEarned > 0 && order.rewardStatus === rewardStatusUtils.transactionSuccess) {
                            let earning = {
                                orderId: order._id.toString(),
                                rewardCoinsEarned: coinsEarned,
                                products,
                                createdAt: order.createdAt
                            }
                            response.push(earning)
                        }
                        if (order.discount > 0 && order.discount !== order.refundCoinsUsed) {
                            let spending = {
                                orderId: order._id.toString(),
                                rewardCoinsUsed: order.discount - order.refundCoinsUsed,
                                products,
                                createdAt: order.createdAt
                            }
                            response.push(spending)
                        }
                        orderIndex++;
                        if (orderIndex === orders.length) {
                            resolve()
                        }
                    })
                }
            }
            else resolve()
        })
    })
    getRewardCoinData.then(() => {
        User.findOne({ _id: userId }).lean().then(user => {
            response.push({ userCoinBalance: user.coinBalance })
            return res.send(response)
        })
    })
}

exports.addFeedback = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const userId = req.user.id
    const productId = Long.fromString(req.body.productId.toString())
    try {
        s3.listObjects(params, async function (error, data) {
            if (error) {
                console.error("error in adding Feedback. Error: ", error, error.stack); // an error occurred
            } else {
                Orders.aggregate([
                    { $match: { userId } },
                    { $unwind: '$products' },
                    { $match: { 'products._id': productId, 'products.statusLog': { $elemMatch: { orderStatus: orderStatus.orderDelivered } } } },
                ]).then(results => {
                    if (results.length > 0) {
                        Product.findOne({ _id: productId, feedback: { $elemMatch: { userId } } }).then(productFeedback => {
                            if (productFeedback === null) {
                                const feedbackId = 'FB' + new Date().getTime().toString();
                                let imageCount = 0
                                const copyImage = new Promise(async (resolve, reject) => {
                                    if (!req.body.feedbackImages || req.body.feedbackImages.length === 0) {
                                        resolve()
                                    }
                                    else {
                                        checkImageExist(req.body.feedbackImages).then(async () => {
                                            for await (const feedbackImage of req.body.feedbackImages) {
                                                const oldImageFileKey = 'images/temp/' + feedbackImage
                                                const newImageFileKey = `feedbackImages/${feedbackId}/` + feedbackImage
                                                await s3.copyObject({
                                                    Bucket: awsConfig.bucket,
                                                    CopySource: `${awsConfig.bucket}/${oldImageFileKey}`,
                                                    Key: newImageFileKey,
                                                    ACL: 'public-read',
                                                }).promise()
                                                    .then(() => {
                                                        imageCount++
                                                        if (imageCount === req.body.feedbackImages.length) {
                                                            resolve()
                                                        }
                                                        s3.deleteObject({
                                                            Bucket: awsConfig.bucket,
                                                            Key: oldImageFileKey
                                                        }).promise()
                                                    })
                                                    .catch(error => {
                                                        console.error(`Error copying feedbackImage: ${feedbackImage}`, error)
                                                        reject({ message: "Error copying feedbackImages.", errorCode: errorCode.Failed_adding_product });
                                                    })
                                            }
                                        }).catch((error) => {
                                            reject(error)
                                        })
                                    }
                                })
                                copyImage.then(async () => {
                                    let updateBody = {
                                        $push: {
                                            feedback: [{ _id: feedbackId, userId, rating: req.body.rating, reviewTitle: req.body.reviewTitle, review: req.body.review, feedbackImages: req.body.feedbackImages }]
                                        }
                                    }
                                    Product.findByIdAndUpdate(productId, updateBody).then(() => {
                                        return res.send({ message: "Feedback added successfully!" })
                                    }).catch(error => {
                                        console.error(`Error while adding product (${productId} feedback. Error: ${error}`)
                                        return next(new BadRequest("Error while adding feedback", errorCode.Error_while_adding_feedback))
                                    })

                                }).catch((error) => {
                                    return next(new BadRequest(error.message, error.errorCode))
                                })
                            }
                            else {
                                return next(new BadRequest("User has already rated / reviewed the product.", errorCode.Feedback_already_exists))
                            }
                        })
                    }
                    else {
                        return next(new BadRequest("User has not purchased / recieved the Item.", errorCode.User_does_not_own_item))
                    }
                })
            }
        });
    } catch (error) {
        console.error(`Error while adding review for product: ${productId}. Error: ${error}`)
    }
}

function checkImageExist(imageArray) {
    return new Promise(async (resolve, reject) => {
        let totalImageCount = imageArray.length
        let currentIteration = 0
        if (imageArray.length === 0)
            resolve()
        while (currentIteration !== totalImageCount) {
            let currentImage = imageArray[currentIteration]
            let checkImage = new Promise(async (resolve, reject) => {
                s3.headObject({
                    Bucket: awsConfig.bucket,
                    Key: 'images/temp/' + currentImage
                }, (err, metadata) => {
                    if (err) {
                        currentIteration = totalImageCount
                        reject({ message: "One or more Image file not found in server.", errorCode: errorCode.Product_image_file_not_found });
                    } else {
                        resolve()
                    }
                });
            })
            await checkImage.then(() => {
                currentIteration++
                if (currentIteration === totalImageCount) {
                    resolve();
                }
            }).catch(() => {
                currentIteration = totalImageCount
                reject({ message: "One or more Image file not found in server.", errorCode: errorCode.Product_image_file_not_found });
            })
        }
    })
}

exports.removeFeedback = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const userId = req.user.id;
    const productId = Long.fromString(req.params.id.toString())
    const feedbackId = req.params.feedbackId
    try {
        Product.aggregate([
            { $match: { _id: productId } },
            { $unwind: '$feedback' },
            { $match: { 'feedback._id': feedbackId } },
        ]).then(result => {
            if (result.length > 0) {
                if (result[0].feedback.userId === userId) {
                    let FeedbackImages = result[0].feedback.feedbackImages
                    const deleteImage = new Promise(async (resolve, reject) => {
                        if (FeedbackImages === undefined) {
                            resolve()
                        }
                        else {
                            for (const element of FeedbackImages) {
                                s3.deleteObject({
                                    Bucket: awsConfig.bucket,
                                    Key: `feedbackImages/${feedbackId}/${element}`
                                }).promise()
                            }
                            resolve()
                        }
                    }).then(() => {
                        let updateBody = {
                            $pull: {
                                feedback: { _id: feedbackId }
                            }
                        }
                        Product.findByIdAndUpdate(productId, updateBody).then(updatedData => {
                            return res.send({ message: "Feedback removed successfully!" })
                        }).catch(error => {
                            console.error(`Error while deleting product (${productId}) feedback. Error: ${error}`)
                            return next(new BadRequest("Error while deleting feedback", errorCode.Error_while_deleting_feedback))
                        })
                    }).catch((error) => {
                        return next(new BadRequest("Error while deleting feedback", errorCode.Error_while_deleting_feedback))
                    })
                }
                else {
                    return next(new BadRequest("Feedback does not exist for user.", errorCode.Feedback_not_found))
                }
            }
            else {
                console.error(`Feedback ${feedbackId} not found.`)
                return next(new BadRequest("Feedback Not Found", errorCode.Feedback_not_found))
            }
        })
    } catch (error) {
        console.error(`Error while removing review for product: ${productId}. Error: ${error}`)
    }
}

exports.editFeedback = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const userId = req.user.id;
    let updateBody = {}
    const productId = Long.fromString(req.params.id.toString());
    const feedbackId = req.params.feedbackId;

    let errorFlag = 0;

    Product.aggregate([
        { $match: { _id: productId } },
        { $unwind: '$feedback' },
        { $match: { 'feedback._id': feedbackId } },
    ]).then(result => {
        if (result.length > 0 && result[0].feedback.userId === userId) {
            let oldFeedbackImages = result[0].feedback.feedbackImages
            let imageCount = 0
            let copyImages = new Promise(async (resolve, reject) => {
                if (req.body.feedbackImages) {
                    let newFeedBackImages = req.body.feedbackImages
                    let updateCounter = 0;
                    let newImagesOnly = newFeedBackImages.filter(x => !oldFeedbackImages.includes(x));
                    checkImageExist(newImagesOnly).then(async () => {
                        if (req.body.feedbackImages.length === 0) {
                            resolve()
                        }
                        updateFeedbackImages = req.body.feedbackImages
                        for await (const newFeedbackImage of newFeedBackImages) {
                            if (!oldFeedbackImages.includes(newFeedbackImage)) {
                                const oldImageFileKey = 'images/temp/' + newFeedbackImage
                                const newImageFileKey = `feedbackImages/${feedbackId}/` + newFeedbackImage
                                await s3.copyObject({
                                    Bucket: awsConfig.bucket,
                                    CopySource: `${awsConfig.bucket}/${oldImageFileKey}`,
                                    Key: newImageFileKey,
                                    ACL: 'public-read',
                                }).promise()
                                    .then(() => {
                                        imageCount++
                                        if (imageCount === req.body.feedbackImages.length)
                                            resolve()
                                        updateCounter++
                                        s3.deleteObject({
                                            Bucket: awsConfig.bucket,
                                            Key: oldImageFileKey
                                        }).promise()
                                    })
                                    .catch(error => {
                                        reject({ message: "Error copying images.", errorCode: errorCode.Failed_adding_product })
                                        console.error(`Error in s3.copyObject (edit feedbackImages) for image: ${newFeedbackImage}. Error: `, error.code)
                                        errorFlag = 1;
                                    })
                            } else {
                                imageCount++
                                if (imageCount === req.body.feedbackImages.length)
                                    resolve()
                                updateCounter++;
                            }
                        }
                    }).catch((error) => {
                        reject(error)
                    })
                    for (const element of oldFeedbackImages) {
                        if (!newFeedBackImages.includes(element)) {
                            s3.deleteObject({
                                Bucket: awsConfig.bucket,
                                Key: `feedbackImages/${feedbackId}/${element}`
                            }).promise()
                        }
                    }
                }
                else {
                    resolve()
                }
            })
            updateBody = {
                'feedback.$.rating': req.body.rating,
                'feedback.$.reviewTitle': req.body.reviewTitle
            }
            if (req.body.review !== undefined) {
                updateBody = {
                    ...updateBody,
                    'feedback.$.review': req.body.review
                }
            }
            if (req.body.feedbackImages) {
                updateBody = {
                    ...updateBody,
                    'feedback.$.feedbackImages': req.body.feedbackImages
                }
            }
            updateBody = {
                ...updateBody,
                'feedback.$.edited': 1,
                'feedback.$.date': Date.now()
            }
            if (errorFlag === 0) {
                copyImages.then(() => {
                    Product.updateOne({ _id: productId, 'feedback._id': feedbackId }, {
                        $set: updateBody
                    }).then(updateStatus => {
                        if (updateStatus.modifiedCount > 0)
                            return res.send({ message: "Feedback Updated Successfully!" })
                        else
                            return next(new BadRequest("Could not update feedback.", errorCode.Could_not_update_feedback))
                    })
                }).catch((error) => {
                    return next(error)
                })
            }
        }
        else {
            return next(new BadRequest("Feedback does not exist for user.", errorCode.Feedback_not_found))
        }
    })
}

exports.paymentInititated = (req, res, next) => {
    const orderId = Long.fromString(req.params.orderId);
    const txHash = req.body.txHash;
    try {
        Orders.findOne({ _id: orderId }).then(order => {
            Orders.updateOne({ _id: orderId }, { $set: { paymentTxHash: txHash } }).then(() => {
                return res.status(200).send({ message: `payment successfully inititated for order: ${orderId}` })
            })
        })
    } catch (error) {
        console.error(`Error occured while storing txHash for Order: ${orderId}`)
        return next(new GeneralError("Error occured while storing txnHash", errorCode.Failed_storing_tranasaction_hash))
    }
}


exports.addAddress = async (req, res, next) => {
    const userId = req.user.id;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    else {
        let { name, mobile, pincode, state, address, locality, city, country, label } = req.body;
        const id = Math.floor(Math.random() * 1000).toString() + new Date().getTime().toString();
        let updateBody = {
            $push: {
                'address': [{
                    _id: id,
                    name: name,
                    mobile: mobile,
                    pincode: pincode,
                    state: state,
                    address: address,
                    locality: locality,
                    city: city,
                    country: country,
                    label: label,
                }]
            }
        };
        // if (((await User.find({ _id: userId, 'address.label': label }).count()) > 0) && ((label === 0) || (label === 1))) {
        //     return next(new BadRequest("Address exist with given type", errorCode.Address_exist_with_given_type));
        // }
        // else {
        let limitExceeds = await User.find({ _id: userId }, { address: 1, _id: 0 }).then((data) => {
            if (data) {
                if (data[0].address.length > 2) {
                    return true;
                }
                else if (data[0].address.length === 0) {
                    updateBody = {
                        $push: {
                            'address': [{
                                _id: id,
                                name: name,
                                mobile: mobile,
                                pincode: pincode,
                                state: state,
                                address: address,
                                locality: locality,
                                city: city,
                                country: country,
                                label: label,
                                primary: 1
                            }]
                        }
                    };
                }
            }
            else {
                return false;
            }
        }).catch((error) => {
            return next(new GeneralError(`Error when fetching address,  error:${error}`, 500))
        })
        if (!limitExceeds) {
            User.findOneAndUpdate({ _id: userId }, updateBody).then(response => {
                return res.send({ message: "Address added successfully!" });
            }).catch((error) => {
                return next(new GeneralError(`Error when adding address. Error:${error}`, 500))
            })
        }
        else {
            return next(new BadRequest(`Error when adding address. Error: Limit exceeds, only 3 addresses are allowed to add.`, errorCode.Allowed_limit_for_address_reached))
        }
        // }

    }
}

exports.updateAddress = async (req, res, next) => {
    const userId = req.user.id;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    else {
        let { name, mobile, pincode, state, address, locality, city, country, label, primary } = req.body;
        const id = req.params.id;
        // const userRecord = await User.aggregate([
        //     { $match: { _id: userId } },
        //     { $unwind: '$address' },
        //     { $match: { 'address.id': id } },
        // ]);
        // prevLabel = userRecord[0].address.label;
        // if (prevLabel === 2) {
        //     if (((await User.find({ _id: userId, 'address.label': label }).count()) > 0) && ((label === 0) || (label === 1))) {
        //         return next(new BadRequest("Address exist with given type", errorCode.Address_exist_with_given_type));
        //     }
        // }
        if (primary === 1) {
            User.updateOne(
                {
                    _id: userId,
                    address: { $elemMatch: { primary: { $eq: 1 } } }
                },
                { $set: { "address.$[elem].primary": 0 } },
                { arrayFilters: [{ "elem.primary": 1 }] }
            ).then(data => {
                if (!data) {
                    console.error("Error: Failed to make other addresses non default");
                }
            })
        }
        User.updateOne(
            { _id: userId, "address._id": id },
            {
                $set:
                {
                    "address.$[elem]": {
                        "_id": id, "name": name, "mobile": mobile, "pincode": pincode, "state": state, "address": address, "locality": locality, "city": city, "country": country, "label": label, "primary": primary
                    }
                }
            },
            { arrayFilters: [{ "elem._id": id }] }
        ).then(response => {
            if (response.modifiedCount > 0)
                return res.send({ message: "Updated!" });
            else {
                return next(new BadRequest(`couldn't fetch the  address with given id,  error:${id}`, errorCode.Address_not_found))

            }
        }).catch((error) => {
            return next(new GeneralError(`error when updating address,  error:${error}`, 500))
        })
    }
}

exports.deleteAddress = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const userId = req.user.id;
    const id = req.params.id;
    const updateBody = {
        $pull: { 'address': { _id: id } }
    }
    User.updateOne(
        { _id: userId, address: { $elemMatch: { _id: id } } }, updateBody
    ).then(response => {
        if (response.modifiedCount > 0)
            return res.send({ message: "Deleted!" });
        else {
            return next(new BadRequest(`Couldn't fetch the  address with given id:${_id}`, errorCode.Address_not_found))
        };
    }).catch((error) => {
        return next(new GeneralError(`error when deleting address,  error:${error}`, 500))
    })
}

exports.listAddress = async (req, res, next) => {
    const userId = req.user.id;
    User.find({ _id: userId }, { address: 1, _id: 0 }).then((data) => {
        if (data)
            return res.send(data);
        else {
            return res.send({ message: "Address list is empty!" })
        }
    }).catch((error) => {
        return next(new GeneralError(`error when fetching address,  error:${error}`, 500))
    })

}

//Return items
exports.returnProduct = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const userId = req.user.id;
    const orderId = Long.fromString(req.params.orderId.toString());
    const productId = Long.fromString(req.query.productId.toString());
    Orders.aggregate([
        { $match: { _id: orderId, userId } },
        { $unwind: '$products' },
        { $match: { 'products._id': productId } },
    ]).then(orderRecords => {
        if (orderRecords.length > 0) {
            const orderRecord = orderRecords[0]
            const currentProduct = orderRecord.products
            if (currentProduct.orderStatus === orderStatus.orderDelivered) {
                if (currentProduct.returnStatus === 0) {
                    let updateBody = {
                        $set: { 'products.$.orderStatus': orderStatus.returnInitiated },
                        $push: {
                            'products.$.statusLog': [{
                                _id: 'SL' + orderStatus.returnInitiated + new Date().getTime().toString(),
                                orderStatus: orderStatus.returnInitiated,
                                user: "User"
                            }]
                        }
                    }
                    Orders.updateOne({ _id: orderId, 'products._id': productId }, updateBody).then(updateInfo => {
                        if (updateInfo.modifiedCount === 1) {
                            //Notification
                            let payload = {
                                data: {
                                    title: "Order Details",
                                    body: notificationUtil.notificationBody[10],
                                    click_action: "/orderdetails/" + orderId.toString()
                                }
                            }
                            User.findById(userId).then(userRecord => {
                                const notification = new Notification({
                                    orderId,
                                    title: payload.data.title,
                                    body: payload.data.body,
                                    click_action: payload.data.click_action,
                                    publicAddress: [userId],
                                    deviceToken: [userRecord.deviceToken],
                                });
                                notification.save(notification)
                                    .then((data) => {
                                    })
                                    .catch((err) => {
                                        console.error(`ERROR in saving notification in return.Error: ${err}`);
                                    })
                                if (userRecord.deviceToken != "") {
                                    app.messaging().sendToDevice(userRecord.deviceToken, payload)
                                        .then(function (response) {
                                        })
                                        .catch(function (error) {
                                            console.error("Error sending message:", error);
                                        });
                                }
                                else {
                                    console.error({ error: "Couldn't fetch device token for the user!", error_Code: errorCode.could_not_fetch_device_token })
                                }
                            })
                            return res.send({ message: "Order Return Inititated." });
                        }
                    }).catch(error => {
                        console.error(`Error while updating order status. Error: ${error}`);
                        return next(new BadRequest("Error while updating order status.", errorCode.Failed_to_updateOrderStatus))
                    })
                }
                else {
                    return next(new BadRequest("Return period of the order is over.", errorCode.Return_period_over))
                }
            }
            else {
                return next(new BadRequest("Invalid Order Status.", errorCode.Invalid_orderStatus))
            }
        }
        else {
            return next(new BadRequest("Order Id and product Id combination does not exist for the current user.", errorCode.Invalid_OrderId))
        }
    })
}

//Add device token
exports.addNotificationToken = async (req, res, next) => {

    const id = req.user.id;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    try {
        let updateBody = {
            deviceToken: req.body.deviceToken,
        }
        User.findByIdAndUpdate(id, updateBody)
            .then((data) => {
                if (data)
                    res.send({
                        message:
                            "Successfully added device token!"
                    });
            })
            .catch((err) => {
                return next(new GeneralError(`Failed to add device token!.Some error occured:${err}`, errorCode.Error_while_adding_notification))
            })
    }
    catch (error) {
        return next(new GeneralError(`Failed to add device token!.Some error occured:${error}`, errorCode.Error_while_adding_notification))
    }
}

//To list notifications

exports.listNotification = (req, res, next) => {
    let publicAddress = req.user.id;
    Notification.find({ publicAddress: { $elemMatch: { $eq: publicAddress } } }).sort({ createdAt: -1 }).lean().then((data) => {
        data.forEach(data => {
            data.orderId = data.orderId.toString()
        })
        res.send({
            message: "Success!",
            data
        });
    })
        .catch((err) => {
            return next(new GeneralError(`Error occurred while fetching  notifications.Error:${err}`, errorCode.Error_while_fetching_notification));
        })
}

//Update notification status (status=1:read)
exports.updateNotificationStatus = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    let id = req.params.id;
    let updateBody = {
        status: 1
    }

    Notification.findByIdAndUpdate(id, updateBody)
        .then((data) => {
            if (!data) {
                return next(new BadRequest(`Notification not found!`, errorCode.Notification_not_found));
            }
            res.send({
                message:
                    "Successfully updated!"
            });
        })
        .catch((err) => {
            return next(new GeneralError(`Failed to Update notification status.Error:${err}`, errorCode.Error_while_updating_notification));
        })
}

exports.updateNotificationStatusAll = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    let status = req.query.status;
    let userId = req.user.id;
    let updateBody = {
        $set: { status }
    }
    Notification.updateMany({ publicAddress: { $size: 1 }, publicAddress: { $elemMatch: { $eq: userId } } }, updateBody).then(updateInfo => {
        if (updateInfo.modifiedCount === 0) {
            return next(new BadRequest(`Failed to Update notification status.`, errorCode.Error_while_updating_notification));
        }
        else {
            res.send({
                message:
                    "Successfully updated!"
            });
        }
    }).catch((err) => {
        return next(new GeneralError(`Failed to Update notification status.Error:${err}`, errorCode.Error_while_updating_notification));
    })
}

//To return count based on status(0 or 1)
exports.returnNotificationStatusCount = (req, res, next) => {
    let publicAddress = req.user.id;
    let status = req.params.status;
    if (["0", "1"].includes(status)) {
        Notification.find({ publicAddress: { $elemMatch: { $eq: publicAddress } }, status: status }).count()
            .then((data) => {
                res.send({
                    message: "Success!",
                    count: data
                });
            })
            .catch((err) => {
                return next(new GeneralError(`Error occurred while fetching the notifications.Error:${err}`, errorCode.Error_while_fetching_notification));
            })
    }
    else {
        return next(new BadRequest(`Invalid notification status`, errorCode.Invalid_notification_status));
    }
}

//Add user response
exports.addResponse = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const userId = req.user.id;
    let { orderId, response, productId } = req.body;
    orderId = Long.fromString(orderId.toString())
    const userRecord = await User.findOne({ _id: userId })
    const orderRecord = await Orders.findOne({ _id: orderId, userId: userId })
    const checkProduct = await Orders.findOne({ _id: orderId, userId: userId, "products._id": productId })
    const productRecord = await Product.findOne({ _id: productId, deleted: 0 })
    const chatbotid = Long.fromString(Math.floor(Math.random() * 1000).toString() + new Date().getTime().toString());
    if (userRecord) {
        if (orderRecord) {
            if (checkProduct) {
                if (productRecord) {
                    if ((await ChatBot.find({ userId: userId, orderId: orderId, productId: productId }).count()) === 0) {
                        const chat = new ChatBot({
                            _id: chatbotid,
                            orderId: orderId,
                            productId: productId,
                            userId: userId,
                            message: [{ response: response }]
                        });
                        chat.save(chat)
                            .then((data) => {
                                return res.status(200).send({ message: "Response added successfully" })
                            })
                            .catch((error) => {
                                console.error("Failed: " + error)
                                return next(new BadRequest("Error occurred while adding response :", errorCode.Failed_to_addResponse))
                            })
                    }
                    else {
                        let chatId;
                        const updateBody = {
                            $push: { 'message': [{ response: response }] },
                            replyStatus: 0,
                            mailStatus: 0
                        }
                        new Promise((resolve, reject) => {
                            ChatBot.findOne({ userId: userId, orderId: orderId, productId: productId }).then((response) => {
                                chatId = response._id;
                                resolve(chatId)
                            })
                        }).then(async (result) => {
                            ChatBot.findOneAndUpdate({ _id: chatId }, updateBody, { upsert: true, new: true }).then((response) => {
                                return res.status(200).send({ message: "Response added successfully!" })

                            }).catch((error) => {
                                console.error("Failed: " + error)
                                return next(new BadRequest("Error occurred while adding response :", errorCode.Failed_to_addResponse))
                            })
                        })
                    }
                }
                else {
                    return next(new BadRequest(`No product found with the id ${productId}`, errorCode.Invalid_productId))
                }
            }
            else {
                return next(new BadRequest(`No product with this id ${productId} found for the order ${orderId} `, errorCode.Invalid_productId))
            }
        }
        else {
            return next(new BadRequest(`No order found with the id ${orderId}`, errorCode.OrderId_not_found_for_user))
        }
    }
    else {
        return next(new BadRequest(`No user found in  ${userId}`, errorCode.User_not_Found))
    }
}

//for uploading images for feedback
exports.uploadFeedbackImage = (req, res, next) => {
    try {
        uploadfile(req, res, function (error) {
            if (error) {
                console.error("Error while uploading image. Error: ", error)

                return next(new BadRequest("Error while uploading image.", errorCode.Error_while_uploading_image))
            } else {
                return res.status(200).send({ feedbackImage: req.file.key.replace('images/temp/', '') });
            }
        })
    } catch (error) {
        if (req.file === undefined) {
            return next(new BadRequest("upload file not found.", errorCode.Upload_image_not_found))
        }
        else {
            console.error("An error occurred while uploading product image. Error: ", error)
            return next(new GeneralError("An error occurred while uploading product image.", errorCode.Error_while_uploading_image))
        }
    }
}

//delete feedback images from images/temp/ folder in s3
exports.deleteFeedbackImage = (req, res, next) => {
    if (req.params.file) {
        try {
            s3.headObject({
                Bucket: awsConfig.bucket,
                Key: 'images/temp/' + req.params.file
            }, function (err, metadata) {
                if (err && err.name === 'NotFound') {
                    return next(new BadRequest("File not found", errorCode.Product_image_file_not_found))
                } else if (err) {
                    return next(new BadRequest("Error fetching file.", errorCode.error_fetchin))
                } else {
                    s3.deleteObject({
                        Bucket: awsConfig.bucket,
                        Key: 'images/temp/' + req.params.file
                    }).promise()
                        .then(data => {
                            return res.status(200).send({ message: "File deleted successfully" })
                        }).catch(err => {
                            return next(new BadRequest("File not found", errorCode.Product_image_file_not_found))
                        })
                }
            });
        }
        catch {
            return next(new BadRequest("File not found", errorCode.Product_image_file_not_found))
        }
    }
}

exports.listUserFeedback = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const userId = req.user.id;
    let productId = Long.fromString(req.params.id.toString())
    let docs = {}
    let result = {}
    Product.aggregate([

        {
            $match: {
                _id: productId
            }
        },
        { $unwind: '$feedback' },
        { $match: { 'feedback.userId': userId } },
        {

            $facet: {
                docs: [
                    {
                        $project: {
                            _id: 0,
                            feedback: 1
                        }
                    },
                ]
            }

        },

    ]).then(record => {
        docs = record[0].docs;
        if (docs.length === 0) {
            docs = []
            result = { docs, totalPages: 0 }
        }
        else {
            result = { docs }
        }
        res.send(result)
    }).catch(error => {
        return next(new BadRequest(`Error while fetching orders.Error:${error}`, errorCode.Failed_fetching_orders))
    })
}

exports.getRefundAmount = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    Orders.aggregate([
        { $match: { _id: Long.fromString(req.params.orderId.toString()), userId: req.user.id } },
        { $unwind: '$products' },
        { $match: { 'products._id': Long.fromString(req.query.productId.toString()) } },
    ]).then(orderArray => {
        if (orderArray.length > 0) {
            calculateRefund(orderArray[0], Number(req.query.productQuantity)).then(refundObject => {
                res.send(refundObject)
            }).catch(error => {
                return next(new BadRequest(error.message, error.errorCode))
            })
        }
        else {
            return next(new BadRequest("Order Id and product Id combination does not exist for user.", errorCode.Invalid_OrderId))
        }
    }).catch(error => {
        console.error(`Error while fetching order while calculating refund amount for Order: ${orderId} and Product: ${productId}. Error: ${error}`)
        return next(new BadRequest("Error while fetching order details.", errorCode.Failed_fetching_orders))
    })
}


