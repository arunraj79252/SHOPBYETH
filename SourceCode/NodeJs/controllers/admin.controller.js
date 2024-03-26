const upload = require('../middlewares/storage.middleware');
const uploadfile = upload.single('uploadImage')
const db = require("../models");
const Product = db.product;
const Admin = db.admin;
const ChatBot = db.chatBot;
const nodemailer = require('nodemailer');
const User = db.user;
const AWS = require('aws-sdk');
const awsConfig = require('../config/aws.config');
const bcrypt = require('bcrypt');
const errorCode = require('../utils/error-code.utils')
const { GeneralError, BadRequest, NotFound } = require('../utils/errors');
require('dotenv').config();
const { validationResult } = require('express-validator');
const orderStatus = require('../utils/order-status.utils');
const Mail = require('../Mail/mail');
const Orders = db.orders;
const Category = db.category;
const SubCategory = db.subCategory;
const Brand = db.brand;
const notificationUtil = require('../utils/notification.util');
const Notification = db.notification;
const admin = require("firebase-admin");
const { refundAmount } = require('../utils/blockchain-utils');
const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
const Long = require('mongodb').Long
const RegexEscape = require("regex-escape");
const paymentStatus = require('../utils/payment-status.utils');
const rewardStatusUtils = require('../utils/reward-status.utils');
const Web3 = require('web3');
const { calculateRefund } = require('../utils/orders.utils');
const HomeImage = db.homeImage


// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });

var transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    // service: 'gmail',
    auth: {
        user: 'suchitra.nair59@gmail.com',
        pass: 'fauhkaqwuvetbwny'
    }
});

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

exports.uploadProductImage = (req, res, next) => {
    try {
        uploadfile(req, res, function (error) {
            if (error) {
                console.error("Error while uploading image. Error: ", error)
                return next(new BadRequest("Error while uploading image.", errorCode.Error_while_uploading_image))
            } else {
                return res.status(200).send({ productImage: req.file.key.replace('images/temp/', '') });
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

exports.deleteProductImage = (req, res, next) => {
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
                        // console.error(err);
                        currentIteration = totalImageCount
                        reject({ message: "One or more Image file not found in server.", errorCode: errorCode.Image_notFound });
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
                reject({ message: "One or more Image file not found in server.", errorCode: errorCode.Image_notFound });
            })
        }
    })
}

exports.addProduct = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    try {
        s3.listObjects(params, function (error, data) {
            if (error) {
                console.error("error in addProduct. Error: ", error, error.stack); // an error occurred
            } else {
                const productId = Long.fromString(Math.floor(Math.random() * 100).toString() + new Date().getTime().toString())
                let imageCount = 0
                const copyImage = new Promise(async (resolve, reject) => {
                    checkImageExist(req.body.productImages).then(async () => {
                        for await (const productImage of req.body.productImages) {
                            const oldImageFileKey = 'images/temp/' + productImage
                            const newImageFileKey = `productImages/${productId}/` + productImage
                            await s3.copyObject({
                                Bucket: awsConfig.bucket,
                                CopySource: `${awsConfig.bucket}/${oldImageFileKey}`,
                                Key: newImageFileKey,
                                ACL: 'public-read',
                            }).promise()
                                .then(() => {
                                    imageCount++
                                    if (imageCount === req.body.productImages.length) {
                                        resolve()
                                    }
                                    s3.deleteObject({
                                        Bucket: awsConfig.bucket,
                                        Key: oldImageFileKey
                                    }).promise()
                                })
                                .catch(error => {
                                    console.error(`Error copying productImage: ${productImage}`, error)
                                    reject({ message: "Error copying productImages.", errorCode: errorCode.Failed_adding_product });
                                })
                        }
                    }).catch((error) => {
                        reject(error)
                    })
                })
                let product = new Product({
                    productName: req.body.productName,
                    description: req.body.description,
                    categoryId: req.body.categoryId,
                    subCategoryId: req.body.subCategoryId,
                    brandId: req.body.brandId,
                    typeId: req.body.typeId,
                    originalPrice: req.body.originalPrice,
                    price: req.body.price,
                    availableStock: req.body.availableStock,
                    coverImage: req.body.coverImage,
                    productImages: req.body.productImages,
                    specifications: req.body.specifications,
                    gender: req.body.gender,
                    _id: productId
                })
                copyImage.then(() => {
                    product.save(product)
                        .then(data => {
                            data = data.toObject()
                            data._id = data._id.toString()
                            res.status(200).send(data)
                        })
                        .catch(error => {
                            console.error("Error occured while adding product. Error: ", error)
                            return next(new GeneralError("An error occured while adding product.", errorCode.Failed_adding_product))
                        })
                }).catch((error) => {
                    return next(new BadRequest(error.message, error.errorCode))
                })
            }
        });
    } catch (error) {
        console.error("An error occured while adding product. Error: ", error)
    }
}

exports.editProduct = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const id = Long.fromString(req.params.id.toString())
    let updateBody = {}
    let errorFlag = 0;
    Product.findOne({ _id: id }).then(async currentData => {
        if (currentData !== undefined) {
            let oldProductImages = currentData.productImages
            let newProductImages = req.body.productImages ? req.body.productImages : []
            let oldCoverImage = currentData.coverImage
            if (req.body.coverImage) {
                let newCoverImage = req.body.coverImage
                if (newProductImages.includes(newCoverImage)) {
                    updateBody = {
                        ...updateBody,
                        coverImage: req.body.coverImage
                    }
                }
                else {
                    return next(new BadRequest('Selected cover image not in existing product images.', errorCode.Image_does_not_exist))
                }
            }
            let imageCount = 0
            let copyImages = new Promise(async (resolve, reject) => {
                if (req.body.productImages) {
                    if (req.body.productImages.length > 0) {
                        let updateCounter = 0;
                        let newProductImages = req.body.productImages
                        let newImagesOnly = newProductImages.filter(x => !oldProductImages.includes(x));
                        checkImageExist(newImagesOnly).then(async () => {
                            for await (const newProductImage of newProductImages) {
                                if (!oldProductImages.includes(newProductImage)) {
                                    const oldImageFileKey = 'images/temp/' + newProductImage
                                    const newImageFileKey = `productImages/${id}/` + newProductImage
                                    await s3.copyObject({
                                        Bucket: awsConfig.bucket,
                                        CopySource: `${awsConfig.bucket}/${oldImageFileKey}`,
                                        Key: newImageFileKey,
                                        ACL: 'public-read',
                                    }).promise()
                                        .then(() => {
                                            imageCount++
                                            if (imageCount === req.body.productImages.length)
                                                resolve()
                                            updateCounter++
                                            s3.deleteObject({
                                                Bucket: awsConfig.bucket,
                                                Key: oldImageFileKey
                                            }).promise()
                                        })
                                        .catch(error => {
                                            reject({ message: "Error copying images.", errorCode: errorCode.Failed_adding_product })
                                            console.error(`Error in s3.copyObject (edit productImages) for image: ${newProductImage}. Error: `, error.code)
                                            errorFlag = 1;
                                        })
                                } else {
                                    imageCount++
                                    if (imageCount === req.body.productImages.length)
                                        resolve()
                                    updateCounter++;
                                }
                            }
                        }).catch((error) => {
                            reject(error)
                        })
                        if (updateCounter === req.body.productImages.length) {
                            for await (const element of oldProductImages) {
                                if (!newProductImages.includes(element)) {
                                    await s3.deleteObject({
                                        Bucket: awsConfig.bucket,
                                        Key: `productImages/${id}/${element}`
                                    }).promise()
                                }
                            }
                        }
                    }
                }
            })

            if (errorFlag === 0) {
                if (req.body.productName) {
                    updateBody = {
                        ...updateBody,
                        productName: req.body.productName
                    }
                }
                if (req.body.description) {
                    updateBody = {
                        ...updateBody,
                        description: req.body.description
                    }
                }
                if (req.body.categoryId) {
                    updateBody = {
                        ...updateBody,
                        categoryId: req.body.categoryId
                    }
                    if (req.body.subCategoryId) {
                        updateBody = {
                            ...updateBody,
                            subCategoryId: req.body.subCategoryId
                        }
                        if (req.body.typeId) {
                            updateBody = {
                                ...updateBody,
                                typeId: req.body.typeId
                            }
                        }
                    }
                }
                if (req.body.brandId) {
                    updateBody = {
                        ...updateBody,
                        brandId: req.body.brandId
                    }
                }
                if (req.body.originalPrice) {
                    updateBody = {
                        ...updateBody,
                        originalPrice: req.body.originalPrice
                    }
                    if (req.body.price && req.body.price <= req.body.originalPrice) {
                        updateBody = {
                            ...updateBody,
                            price: req.body.price
                        }
                    }
                }
                if (req.body.availableStock >= 0) {
                    updateBody = {
                        ...updateBody,
                        availableStock: req.body.availableStock

                    }
                }
                if (req.body.gender >= 0) {
                    updateBody = {
                        ...updateBody,
                        gender: req.body.gender

                    }
                }

                if (req.body.specifications) {
                    updateBody = {
                        ...updateBody,
                        specifications: req.body.specifications
                    }
                }
                updateBody = {
                    ...updateBody,
                    productImages: req.body.productImages
                }
                copyImages.then(() => {
                    Product.findByIdAndUpdate(id, updateBody)
                        .then(data => {
                            return res.send({
                                message:
                                    "Product Edited"
                            });
                        });
                }).catch((error) => {
                    return next(error)
                })
            }
        }
        else {
            return next(new BadRequest("Product not found.", errorCode.Product_not_found))
        }
    }).catch(error => {
        console.error("Error fetching product. Error: ", error)
        return next(new GeneralError("Error fetching product", errorCode.Failed_fetching_product))
    })
}

exports.deleteProduct = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const id = Long.fromString(req.query.id);
    const deleted = Number(req.query.deleted)
    Product.findOne({ _id: id }, "deleted").then(product => {
        if (product.deleted === deleted) {
            return next(new BadRequest("Product already in the given deleted status.", errorCode.Product_already_in_given_deleted_status))
        }
        else {
            Product.updateOne({ _id: id }, { $set: { deleted } }).then(updateInfo => {
                if (updateInfo.modifiedCount > 0)
                    return res.status(200).send({ message: "Product deleted status changed successfully" })
                else
                    return next(new BadRequest("Error in product deleted status change.", errorCode.error))
            })
        }
    })
}

exports.getProductDetail = (req, res, next) => {
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
            deleted: 1,
            'averageRating': { $avg: '$feedback.rating' },
            'ratingCount': { $size: '$feedback' }
        }
        Product.findOne({ _id: id }, projection).lean().then(product => {
            product._id = product._id.toString()
            let index = 1;
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
                return res.status(200).send(product)
            });
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
        let { page, size, views, sales, createdAt, avgRating, rating, gender, price, category, brand, subCategory, keyword, deleted, priceRange, typeId, outOfStock } = req.query
        let limit = size ? Number(size) : 10;
        let sortParams = {}
        let matchParams = {}
        if (!page) { page = 1 }
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
        else sortParams.createdAt = 1
        if (gender) {
            matchParams.gender = Number(gender)
        }
        if (rating) {
            matchParams.$expr = { $gte: [{ $avg: '$feedback.rating' }, Number(rating)] }
        }
        if (deleted) {
            matchParams.deleted = Number(deleted)
        }
        if (typeId) {
            matchParams.typeId = typeId
        }
        if (outOfStock) {
            if (Number(outOfStock) === 1)
                matchParams.availableStock = { $eq: 0 }
            else if (Number(outOfStock) === 0)
                matchParams.availableStock = { $gt: 0 }
        }
        if (keyword) {
            matchParams.productName = { $regex: RegexEscape(keyword), $options: 'i' }
        }
        if (category) {
            matchParams.categoryId = category
            if (subCategory) {
                matchParams.subCategoryId = subCategory
            }
        }
        if (brand) {
            matchParams.brandId = brand
        }
        if (priceRange) {
            let range = priceRange.split(',')
            matchParams.$and = [
                { price: { $gte: Number(range[0]) } },
                { price: { $lte: Number(range[1]) } }
            ]
        }
        let categoryLookup = {
            $lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                as: "category"
            },
        }
        let subCategoryLookup = {
            $lookup: {
                from: "subcategories",
                localField: "subCategoryId",
                foreignField: "_id",
                as: "subCategory"
            }
        }
        let projection = {
            productName: 1,
            price: 1,
            originalPrice: 1,
            categoryId: 1,
            category: { $arrayElemAt: ["$category.name", 0] },
            subCategoryId: 1,
            subCategory: { $arrayElemAt: ["$subCategory.name", 0] },
            availableStock: 1,
            coverImage: 1,
            brandId: 1,
            typeId: 1,
            viewCount: 1,
            saleCount: 1,
            deleted: 1,
            gender: 1,
            'averageRating': { $avg: '$feedback.rating' },
            'ratingCount': { $size: '$feedback' }
        }

        let aggregateQuery = [{ $match: matchParams }, categoryLookup, subCategoryLookup]
        const productAggregate = Product.aggregate(aggregateQuery)
        Product.aggregatePaginate(productAggregate, { page, limit, sort: sortParams, collation: { locale: 'en', strength: 2 }, projection }).then(result => {
            return res.send(result)
        }).catch(error => {
            console.error({ Error: "Error while fetching products. Error: ", error })
            return next(new BadRequest("Error while fetching products.", errorCode.Failed_fetching_product))
        })
    } catch (error) {
        console.error("Error : ", error)
        return next(new BadRequest("Error while fetching products.", errorCode.Failed_fetching_product))
    }
}

//function for updating order status

exports.updateOrderStatus = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const orderId = Long.fromString(req.query.orderId.toString());
    const productId = Long.fromString(req.query.productId.toString());
    const status = Number(req.query.status);
    let updateBody = {};
    let userId;
    let payload = {
        data: {
            title: "Order Details",
            body: notificationUtil.notificationBody[status],
            click_action: "/orderdetails/" + orderId.toString()
        }
    }
    Orders.aggregate([
        { $match: { _id: orderId } },
        { $unwind: '$products' },
        { $match: { 'products._id': productId } },
    ]).then(orderDetail => {
        if (orderDetail.length > 0) {
            let order = orderDetail[0];
            const currentProduct = order.products;
            const currentOrderStatus = currentProduct.orderStatus;
            const statusArray = Array.from(currentProduct.statusLog.map(x => x.orderStatus))
            const setUpdateBody = new Promise(async (resolve, reject) => {

                if (statusArray.includes(orderStatus.refundCompleted)) {
                    reject({ message: "Status can't be updated as refund completed!", errorCode: errorCode.Access_restricted })
                }
                else if (status === orderStatus.waitingForPaymentConfirmation && currentOrderStatus !== orderStatus.orderDelivered) {
                    if (order.paymentTxHash === "" || order.paymentTxHash === null) {
                        reject({ message: "Order status cannot be changed to waiting for payment as no valid transaction hash is present for the order.", errorCode: errorCode.Access_restricted })
                    }
                    else {
                        updateBody = {
                            $set: { 'products.$.orderStatus': orderStatus.waitingForPaymentConfirmation },
                            $push: {
                                'products.$.statusLog': [{
                                    _id: 'SL' + orderStatus.waitingForPaymentConfirmation + new Date().getTime().toString(),
                                    orderStatus: orderStatus.waitingForPaymentConfirmation,
                                    user: "Admin"
                                }]
                            },
                        }
                    }
                    resolve()
                }
                else if (status === orderStatus.orderDelivered) {
                    if (currentOrderStatus === orderStatus.orderOutForDelivery) {
                        let returnDate = new Date(Date.now() + (900000))//86400000 * 7
                        updateBody = {
                            $set: {
                                'products.$.orderStatus': orderStatus.orderDelivered,
                                'products.$.returnDate': returnDate
                            },
                            $push: {
                                'products.$.statusLog': [{
                                    _id: 'SL' + orderStatus.orderDelivered + new Date().getTime().toString(),
                                    orderStatus: orderStatus.orderDelivered,
                                    user: "Admin"
                                }]
                            },
                        }
                        resolve();
                    }
                    else {
                        reject({ message: "Order should be in Out For Delivery Status", errorCode: errorCode.Order_should_be_in_outForDelivery_status })
                    }
                }
                else if (status === orderStatus.returnInitiated) {
                    let statusNotAllowed = [10, 6, 7, 9, 11];
                    if (statusNotAllowed.some(i => statusArray.includes(i))) {
                        return next(new BadRequest("Restricted!", errorCode.Access_restricted))
                    }
                    else if (!(currentOrderStatus === orderStatus.orderDelivered)) {
                        return next(new BadRequest("Restricted! Order status can't update as it is not in Order delivered stage. ", errorCode.Access_restricted))
                    }
                    updateBody = {
                        $set: { 'products.$.orderStatus': orderStatus.returnInitiated },
                        $push: {
                            'products.$.statusLog': [{
                                _id: 'SL' + orderStatus.returnInitiated + new Date().getTime().toString(),
                                orderStatus: orderStatus.returnInitiated,
                                user: "Admin"
                            }]
                        }
                    }
                    resolve();
                }
                else if (status === orderStatus.refundInitiated) {
                    let statusNotAllowed = [7, 8];
                    if (statusNotAllowed.some(i => statusArray.includes(i))) {
                        return next(new BadRequest("Restricted!", errorCode.Access_restricted))
                    }
                    else if (!((currentOrderStatus === orderStatus.orderCanceled) || (currentOrderStatus === orderStatus.returnCompleted))) {
                        return next(new BadRequest("Restricted! Order status can't update as it is not in Order canceled or return completed stage. ", errorCode.Access_restricted))
                    }
                    updateBody = {
                        $set: { 'products.$.orderStatus': orderStatus.refundInitiated },
                        $push: {
                            'products.$.statusLog': [{
                                _id: 'SL' + orderStatus.refundInitiated + new Date().getTime().toString(),
                                orderStatus: orderStatus.refundInitiated,
                                user: "Admin"
                            }]
                        }
                    }
                    resolve();
                }
                else if (status === orderStatus.returnCompleted) {
                    if (currentOrderStatus === orderStatus.returnInitiated) {
                        let productId = currentProduct._id;
                        let quantity = parseInt(currentProduct.productQuantity);
                        await Product.findByIdAndUpdate(productId, { $inc: { saleCount: -quantity, availableStock: quantity } }).then(data => {
                        }).catch((err) => {
                            console.error("error when updating sales count.Error: " + err);
                        });
                        await Orders.updateOne({ _id: Long.fromString(orderId.toString()), 'products._id': productId }, {
                            $set: {
                                'products.$.orderStatus': orderStatus.returnCompleted,
                                'products.$.returnStatus': 1
                            },
                            $push: {
                                'products.$.statusLog': [{
                                    _id: 'SL' + orderStatus.returnCompleted + new Date().getTime().toString(),
                                    orderStatus: orderStatus.returnCompleted,
                                    user: "Admin"
                                }]
                            }
                        }).then(() => {
                            if (Number(order.totalEthereumPaid) > 0 || order.discount > 0) {
                                calculateRefund(order, currentProduct.productQuantity).then(refundObject => {
                                    refundAmount(orderId.toString(), currentProduct._id, order.userId, refundObject.productRefundEthereum, refundObject.productRefundCoin).then(refundTxHash => {
                                        updateBody = {
                                            $set: {
                                                'products.$.returnDate': null,
                                                'products.$.refundTxHash': refundTxHash,
                                                'products.$.orderStatus': orderStatus.refundInitiated,
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
                                    })
                                })
                            }
                            else {
                                payload.data.body = notificationUtil.notificationBody[14]
                                resolve()
                            }
                        }).catch(error => {
                            console.error(`Error in refund amount function for orderId: ${orderId.toString()}. Error: ${error}`)
                            reject(error);
                            return next(new BadRequest("Error in refundAmount.", errorCode.Error_in_refund_process))
                        })
                    }
                    else {
                        reject({ message: "Order should be in return initiated status to move to return completed status.", errorCode: errorCode.Order_should_be_in_returnInitiated_status })
                    }
                }

                else if (status === orderStatus.waitingForPaymentConfirmation || status === orderStatus.orderPlaced || status === orderStatus.orderShipped || status === orderStatus.orderOutForDelivery) {
                    let statusNotAllowed = [4, 6, 7, 8, 9, 10, 11];
                    if (statusNotAllowed.some(i => statusArray.includes(i))) {
                        return next(new BadRequest("Restricted!", errorCode.Access_restricted))
                    }
                    if (currentOrderStatus !== orderStatus.orderDelivered) {
                        updateBody = {
                            'products.$.orderStatus': status,
                            $push: {
                                'products.$.statusLog': [{
                                    _id: 'SL' + status + new Date().getTime().toString(),
                                    orderStatus: status,
                                    user: "Admin"
                                }]
                            },
                        }
                        resolve();
                    }
                    else {
                        reject("Order already in delivered status. Cannot set to an earlier status.", errorCode.Order_already_in_delivered_status)
                    }
                }
                else if (status === orderStatus.orderCanceled) {
                    let statusNotAllowed = [10, 6, 7, 11];
                    if (statusNotAllowed.some(i => statusArray.includes(i))) {
                        return next(new BadRequest("Restricted!", errorCode.Access_restricted))
                    }
                    await Product.findByIdAndUpdate(productId, { $inc: { saleCount: -currentProduct.productQuantity, availableStock: currentProduct.productQuantity } }).then(data => {
                    }).catch((err) => {
                        console.error("error when updating sales count. Error: " + err);
                    });
                    if (order.orderStatus === orderStatus.orderPlaced && order.paymentStatus === paymentStatus.paymentSuccess || order.orderStatus === orderStatus.refundFailed) {
                        await Orders.updateOne({ _id: orderId }, {
                            $set: { 'products.$.orderStatus': orderStatus.orderCanceled },
                            $push: {
                                'products.$.statusLog': [{
                                    _id: 'SL' + orderStatus.orderCanceled + new Date().getTime().toString(),
                                    orderStatus: orderStatus.orderCanceled,
                                    user: "User"
                                }]
                            }
                        }).then(() => {
                            if (Number(order.totalEthereumPaid) > 0 || order.discount > 0) {
                                calculateRefund(order, currentProduct.productQuantity).then(refundObject => {
                                    refundAmount(orderId.toString(), currentProduct._id, order.userId, refundObject.productRefundEthereum, refundObject.productRefundCoin).then(refundTxHash => {
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
                                    }).catch(error => {
                                        console.error(`Error in refund amount function for orderId: ${orderId.toString()}. Error: ${error}`)
                                        reject(error);
                                        return next(new BadRequest("Error in refundAmount.", errorCode.Error_in_refund_process))
                                    })
                                })
                            }
                            else {
                                resolve()
                            }
                        })
                    }
                    else {
                        updateBody = {
                            'products.$.orderStatus': orderStatus.orderCanceled,
                            $push: {
                                'products.$.statusLog': [{
                                    _id: 'SL' + orderStatus.orderCanceled + new Date().getTime().toString(),
                                    orderStatus: orderStatus.orderCanceled,
                                    user: "Admin"
                                }]
                            },
                        }
                        resolve()
                    }
                }
                else {
                    updateBody = {
                        'products.$.orderStatus': status,
                        $push: {
                            'products.$.statusLog': [{
                                _id: 'SL' + status + new Date().getTime().toString(),
                                orderStatus: status,
                                user: "Admin"
                            }]
                        },
                    }
                    resolve()
                }
            })
            setUpdateBody.then(() => {
                Orders.updateOne({ _id: Long.fromString(orderId.toString()), 'products._id': Long.fromString(productId.toString()) }, updateBody).then(updateInfo => {
                    if (updateInfo.modifiedCount > 0) {
                        userId = order.userId;
                        //Send Notification
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
                                    console.error(`ERROR in saving notification in updateOrderStatus.Error: ${err}`);
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
                        return res.send({ message: "Successfully updated status" });
                    }
                    else throw new BadRequest("Error while updating database.")
                }).catch((error) => {
                    return next(new BadRequest(`Error while updating order status. Error: ${error}`, errorCode.Failed_to_updateOrderStatus))
                })
            }).catch(error => {
                return next(new BadRequest(error.message, error.errorCode))
            })
        }
        else {
            return next(new BadRequest(`No such product found in given order.`, errorCode.Product_not_found))
        }
    }).catch((err) => {
        return next(new BadRequest(`Failed to fetch Order details.Error:${err}`, 500));
    })
}

//creates fake data for product collection and also inserting files to 
// exports.fake = async (req, res, next) => {

//     let i = 0;
//     const coverImage = "coverImage.jpg";
//     while (i < 250) {
//         try {
//             const productImages = ["image1.jpg", "image2.jpg", "image3.jpg"]
//             s3.listObjects(params, function (error, data) {
//                 if (error) {
//                     console.error(error, error.stack); // an error occurred
//                 } else {
//                     const productId = Math.floor(Math.random() * 100).toString() + new Date().getTime().toString()
//                     const oldCoverFileKey = 'images/temp/' + coverImage
//                     const newCoverFileKey = `productImages/${productId}/` + coverImage
//                     s3.copyObject({
//                         Bucket: awsConfig.bucket,
//                         CopySource: `${awsConfig.bucket}/${oldCoverFileKey}`,
//                         Key: newCoverFileKey,
//                         ACL: 'public-read',
//                     }).promise()
//                         .then(response => {
//                             if (productImages.length > 0) {
//                                 for (const productImage of productImages) {
//                                     const oldImageFileKey = 'images/temp/' + productImage
//                                     const newImageFileKey = `productImages/${productId}/` + productImage
//                                     s3.copyObject({
//                                         Bucket: awsConfig.bucket,
//                                         CopySource: `${awsConfig.bucket}/${oldImageFileKey}`,
//                                         Key: newImageFileKey,
//                                         ACL: 'public-read',
//                                     }).promise()
//                                         .catch(error => {
//                                             console.error("Error copying productImages. Error: ", error)
//                                         })
//                                 }
//                             }
//                             let product = new Product({
//                                 productName: faker.commerce.productName(),
//                                 description: faker.commerce.productDescription(),
//                                 categoryId: 001,
//                                 price: faker.datatype.number({
//                                     "min": 80,
//                                     "max": 1000
//                                 }),
//                                 availableStock: faker.datatype.number({
//                                     "min": 0,
//                                     "max": 150
//                                 }),
//                                 coverImage: coverImage,
//                                 productImages: productImages,
//                                 viewCount: faker.datatype.number({
//                                     "min": 10,
//                                     "max": 1000
//                                 }),
//                                 saleCount: faker.datatype.number({
//                                     "min": 10,
//                                     "max": 250
//                                 }),
//                                 gender: faker.datatype.number({
//                                     "min": 0,
//                                     "max": 3
//                                 }),
//                                 _id: productId
//                             })
//                             product.save(product)
//                                 .catch(error => {
//                                     console.error("Error occured while adding product. Error: ", error)
//                                     return next(new GeneralError("An error occured while adding product.", 500))
//                                 })
//                         })
//                         .catch(error => {
//                             console.error("No coverImage file found in server for s3.copyObject. Error: ", error)
//                             return next(new GeneralError("No such file found in server", 500))
//                         });
//                 }
//             });
//         } catch (error) {
//             console.error("An error occured while adding product. Error: ", error)
//         }
//         i++;
//     }
//     return res.send("Added");
// }

exports.registerAdmin = async (req, res, next) => {
    let admin = new Admin({
        username: req.body.username,
        password: req.body.password
    })
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(admin.password, salt);
    await admin.save()
    return res.send(admin)
}

exports.checkLogin = (req, res, next) => {
    return res.send(req.user)
}


exports.addCategory = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const id = 'CAT' + new Date().getTime().toString();

    const category = new Category({
        _id: id,
        name: req.body.name
    });
    const exist = await Category.findOne({ name: req.body.name })
    if (exist) {
        return next(new BadRequest("Category exists!", errorCode.Category_exist));
    }
    else {

        await category.save().then((data) => {
            return res.send(data)
        })
            .catch((error) => {
                return next(new GeneralError(`Error when adding category,  error:${error}`, 500)
                )
            })
    }


}
exports.deleteCategory = async (req, res, next) => {
    const id = req.params.id;
    let flag = false;
    await SubCategory.findOne({ categoryId: id }).then((data) => {
        if (data != null) {
            flag = true;

        }
    })
    await Product.findOne({ categoryId: id }).then((result) => {
        if (result != null) {
            flag = true;
        }
    })
    if (flag) {
        return next(new BadRequest(`Error when deleting  category, product or subcategory  exist with given category`, errorCode.Dependancy_error_category));
    }
    else {
        await Category.findOneAndDelete({ _id: id }).then((data) => {
            if (data)
                return res.send({ message: "Deleted!" })
            else
                return next(new BadRequest("Category not exist or  have already been removed", errorCode.Category_not_found));

        }).catch((error) => {
            return next(new GeneralError(`Error when deleting category,  error:${error}`, 500))

        })
    }

}
exports.addSubCategory = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    let sname = req.body.name.trim();
    const id = 'SUBCAT' + new Date().getTime().toString();
    const categoryExist = await Category.findOne({ _id: req.body.categoryId })
    if (categoryExist) {
        const exist = await SubCategory.findOne({ categoryId: req.body.categoryId, name: req.body.name })
        if (exist) {
            return next(new BadRequest(" Subcategory exists", errorCode.Subcategory_exist));
        } else {
            const typeId = 'TYPE' + new Date().getTime().toString();
            let cat = {}
            cat = await Category.findOne({ _id: req.body.categoryId })
            if (cat.name.trim() != sname) {
                const category = new SubCategory({
                    _id: id,
                    categoryId: req.body.categoryId,
                    name: sname,
                    type: [{
                        _id: typeId,
                        name: "No Type"
                    }]
                });
                await category.save().then((data) => {
                    return res.send(data)
                })
                    .catch((error) => {
                        return next(new GeneralError(`Error when adding subcategory,  error:${error}`, 500)
                        )
                    })
            }
            else {
                return next(new BadRequest(` Category and Subcategory cannot have same name: ${cat.name.trim()}`, errorCode.Subcategory_name_duplication))
            }
        }
    }
    else {
        return next(new BadRequest(` Category does not exist with  id: ${req.body.categoryId}`, errorCode.Category_not_found))
    }
}

exports.deleteSubCategory = async (req, res, next) => {
    const id = req.params.id;
    await SubCategory.findOne({ _id: id }).then(async (data) => {
        if (data != null) {
            let types = Array.from(data.type.map(x => x._id));
            await Product.findOne({ $or: [{ subCategoryId: id }, { typeId: { $in: types } }] }).then((result) => {
                if (result != null) {
                    return next(new BadRequest(`Error when deleting Sub category, product exist with given subcategory or type`, errorCode.Dependancy_error_subcategory));
                } else {
                    SubCategory.findOneAndDelete({ _id: id }).then((data) => {
                        if (data)
                            return res.send({ message: "Deleted!" })
                        else
                            return next(new BadRequest(`Subcategory not found or  have already been removed!`, errorCode.Subcategory_not_found));
                    }).catch((error) => {
                        return next(new GeneralError(`Error when deleting Subcategory,  error:${error}`, 500))
                    })
                }
            })
        }
        else {
            return next(new BadRequest(`Subcategory not found or  have already been removed!`, errorCode.Subcategory_not_found));
        }
    }).catch((err) => {
        return next(new GeneralError(`Error when deleting Subcategory,  error:${err}`, 500))
    })
}

//View all orders (Sales History)
exports.viewOrders = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }

    let { page, size, createdate, orderstat, paystat, keyword } = req.query
    let limit = size ? Number(size) : 10;
    let pageNumber = page ? Number(page) : 1;
    let sortParams = {}
    let matchParams = {}
    let docs = {}
    let result = {}
    let totaldocs = 0
    let totalpages = 0
    let skipValue = (pageNumber - 1) * limit
    sortParams.createdAt = createdate ? Number(createdate) : -1;
    // if (orderstat) {
    //     matchParams.orderStatus = Number(orderstat)
    // }
    if (paystat) {
        matchParams.paymentStatus = Number(paystat)
    }
    if (keyword) {
        matchParams.$or = [
            { "userName": { $regex: RegexEscape(keyword), $options: 'i' } },
            { "orderId": { $regex: req.query.keyword, $options: 'i' } },
        ]
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
                orderId: { $first: { $toString: { $toLong: '$_id' } } },
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
                        orderStatus: "$products.orderStatus",
                        refundTxHash: "$products.refundTxHash",
                        returnStatus: "$products.returnStatus",
                        returnDate: "$products.returnDate",
                        statusLog: "$products.statusLog",
                        addedDate: "$products.addedDate"
                    }
                },
                paymentStatus: { $first: '$paymentStatus' },
                rewardStatus: { $first: '$rewardStatus' },
                deliveryAddress: { $first: '$deliveryAddress' },
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
                            orderId: 1,
                            userId: 1,
                            userName: 1,
                            products: 1,
                            total: 1,
                            discount: 1,
                            paymentTxHash: 1,
                            rewardTxHash: 1,
                            paymentStatus: 1,
                            rewardStatus: 1,
                            deliveryAddress: 1,
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
            docs.forEach(record => {
                record._id = record._id.toString()
            })
            totaldocs = record[0].pagination[0].totalDocs
            totalpages = Math.ceil(totaldocs / limit)
            result = { docs, page: pageNumber, docsInPage: docs.length, totalPages: totalpages, totalDocs: totaldocs }
        }
        res.send(result)
    }).catch(error => {
        return next(new BadRequest(`Error while fetching orders.Error:${error}`, errorCode.Failed_fetching_orders))
    })

}


//View one order by order id
exports.viewOrderDetails = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const id = Long.fromString(req.params.id.toString());
    Orders.find({ _id: id })
        .lean().then(orders => {
            if (orders.length === 0) { throw "  Order Id Not Found" }
            orders.forEach(element => {
                element._id = element._id.toString()
                User.findOne({ _id: element.userId }).then(user => { element.username = user.name; })
                let loop = new Promise((resolve, reject) => {
                    let index = 1;
                    if (String(typeof (element.products)) != "undefined") {
                        if (orders[0].products.length > 0) {
                            orders[0].products.forEach(product => {
                                Product.findOne({ _id: product._id }).then(productData => {
                                    if (productData != null) {
                                        product.coverImage = productData.coverImage;
                                        product.productName = productData.productName;
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
        }).catch(error => {
            return next(new BadRequest(`Error while fetching orders.${error}`, errorCode.Failed_fetching_orders))
        })
}




exports.updateCategory = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const id = req.params.id;
    const category = {
        name: req.body.name
    };
    if ((await Category.find({ name: req.body.name }).count() > 0) && (await Category.find({ _id: id, name: req.body.name }).count() == 0)) {
        return next(new BadRequest("Category exist with given name!", errorCode.Category_exist));
    }
    else {
        await Category.findOneAndUpdate({ _id: id }, category)
            .then((data) => {
                if (data)
                    return res.send({ message: "Updated!" })
                else {
                    return next(new BadRequest(`Category not found for id:${id}`, errorCode.Category_not_found))

                }

            })
            .catch((error) => {
                return next(new GeneralError(`Error when updating category,  error:${error}`, 500)
                )
            })
    }

}

exports.updateSubCategory = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    let sname = req.body.name.trim();
    let cat = {}
    cat = await Category.findOne({ _id: req.body.categoryId })
    const id = req.params.id;
    const category = {
        categoryId: req.body.categoryId,
        name: sname
    };
    const exist = await Category.findOne({ _id: req.body.categoryId })
    if (exist) {
        if ((await SubCategory.find(category).count() > 0) && (await SubCategory.find({
            _id: id, categoryId: req.body.categoryId,
            name: sname
        }).count() == 0)) {
            return next(new BadRequest("Subcategory exist with given name!", errorCode.Subcategory_exist));
        }
        else {
            if (cat.name.trim() != sname) {
                await SubCategory.findOneAndUpdate({ _id: id }, category)
                    .then((data) => {
                        if (data)
                            return res.send({ message: "Updated!" })
                        else {
                            return next(new BadRequest(`Subcategory  does not exist with id: ${id}`, errorCode.Subcategory_not_found))

                        }
                    })
                    .catch((error) => {
                        return next(new GeneralError(`Error when updating subcategory,  error: ${error}`, 500)
                        )
                    })
            }
            else {
                return next(new BadRequest(` Category and Subcategory cannot have same name: ${cat.name.trim()}`, errorCode.Subcategory_name_duplication))
            }
        }
    }
    else {
        return next(new BadRequest(` Category does not exist with  id: ${req.body.categoryId}`, errorCode.Category_not_found))

    }
}

//brand

exports.addBrand = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const id = 'BRAND' + new Date().getTime().toString();
    const brand = new Brand({
        _id: id,
        name: req.body.name
    });
    Brand.find({ name: req.body.name }).collation({ locale: 'en', strength: 2 }).count().then(async count => {
        if (count > 0)
            return next(new BadRequest("Brand exists!", errorCode.Brand_exist));
        else
            await brand.save().then((data) => {
                return res.send(data)
            })
                .catch((error) => {
                    return next(new GeneralError(`Error when adding Brand,  error:${error}`, 500)
                    )
                })
    })
    // let nameInUpperCase = req.body.name.toUpperCase();
    // let brandRecord = await Brand.aggregate(
    //     [
    //         {
    //             $project:
    //             {
    //                 name: { $toUpper: "$name" },
    //             }
    //         }
    //     ]
    // );
    // let nameArray = Array.from(brandRecord.map(x => x.name));
    // if (nameArray.includes(nameInUpperCase)) {
    //     return next(new BadRequest("Brand exists!", errorCode.Brand_exist));
    // }
    // else {

}


// }
exports.updateBrand = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const id = req.params.id;
    const brand = {
        name: req.body.name
    };
    let nameInUpperCase = req.body.name.toUpperCase();
    let brandRecord = await Brand.aggregate(
        [
            {
                $project:
                {
                    name: { $toUpper: "$name" },
                }
            }
        ]
    );
    let nameArray = Array.from(brandRecord.map(x => x.name));
    let brandId = brandRecord.filter(function (brand) {
        return brand.name === nameInUpperCase;
    }).map(function (brand) {
        return brand._id;
    })

    if ((nameArray.includes(nameInUpperCase)) && (id != brandId[0])) {
        return next(new BadRequest("Brand exist with given name!", errorCode.Brand_exist));
    }
    else {
        await Brand.findOneAndUpdate({ _id: id }, brand)
            .then((data) => {
                if (data)
                    return res.send({ message: "Updated!" })
                else {
                    return next(new BadRequest(`Brand not found for id:${id}`, errorCode.Brand_not_found))

                }

            })
            .catch((error) => {
                return next(new GeneralError(`Error when updating brand,  error:${error}`, 500)
                )
            })
    }

}
exports.deleteBrand = async (req, res, next) => {
    const id = req.params.id;
    let flag = false;
    await Product.findOne({ brandId: id }).then((result) => {
        if (result != null) {
            flag = true;
        }
    })
    if (flag) {
        return next(new BadRequest(`Error when deleting  brand, product   exist with given brand`, errorCode.Dependancy_error_brand));
    }
    else {
        await Brand.findOneAndDelete({ _id: id }).then((data) => {
            if (data)
                return res.send({ message: "Deleted!" })
            else
                return next(new BadRequest("Brand not exists with given ID!", errorCode.Brand_not_found))
        }).catch((error) => {
            return next(new GeneralError(`Error when deleting brand,  error:${error}`, 500))

        })
    }
}

///Orders Analytics
exports.orderAnalytics = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    try {
        let aggregateQuery = [
            {
                $group: {
                    _id: {
                        day: { $dayOfMonth: '$createdAt' },
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' },
                    },
                    counts: { $sum: 1 }
                }
            },
        ]
        let displayCounts = {
            $group: {
                _id: {},
                totalCounts: { $sum: "$counts" }
            },
        }
        if (req.query.year) {
            displayCounts.$group._id.month = "$_id.month";
            displayCounts.$group._id.year = "$_id.year";
            aggregateQuery.push({ $match: { "_id.year": Number(req.query.year) } })
        }
        if (req.query.month) {
            displayCounts.$group._id.day = "$_id.day";
            displayCounts.$group._id.month = "$_id.month";
            aggregateQuery.push({ $match: { "_id.month": Number(req.query.month) } })
        }
        if (req.query.day) {
            aggregateQuery.push({ $match: { "_id.day": Number(req.query.day) } })
        }
        aggregateQuery.push(displayCounts, { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } })
        Orders.aggregate(aggregateQuery).then(data => {
            return res.send(data)
        })
    } catch (error) {
        return next(new GeneralError(`Error while fetching Order analytics.${error}`, errorCode.Invalid_orderAnalytics))
    }
}

//User Analytics
exports.getUserAnalytics = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }

    try {
        let aggregateQuery = [
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    numberOfUsers: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    month: '$_id.month',
                    year: '$_id.year',
                    numberOfUsers: 1
                }
            }, { $sort: { year: 1, month: 1 } }
        ]
        if (req.query.year) {
            aggregateQuery.push({ $match: { year: Number(req.query.year) } })
        }
        User.aggregate(aggregateQuery).then(data => {
            return res.send(data)
        })
    }
    catch (error) {
        return next(new BadRequest(`Error while fetching user analytics.${error}`, errorCode.Invalid_userAnalytics))
    }
}


///Total count

exports.statistics = async (req, res, next) => {
    const usersCount = await User.count();
    const ordersCount = await Orders.count();
    const productsCount = await Product.find({ deleted: 0 }).count();

    try {
        res.status(200).send({
            usersCount: usersCount,
            ordersCount: ordersCount,
            productsCount: productsCount,
        })
    }
    catch (error) {
        return next(new BadRequest(`Error while fetching user,orders and products statistics`, errorCode.Failed_to_fetch_Statistics)
        )
    }

}

//Fetch popular products based on view count
exports.statisticsView_count = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    try {
        Product.find({ deleted: 0, availableStock: { $gt: 0 } }, { _id: 1, "productName": 1, "coverImage": 1, "viewCount": 1 }).lean()
            .limit(5)
            .sort({ viewCount: -1 }).then(data => {

                data.forEach(product => {
                    product._id = product._id.toString()
                })
                return res.send(data);
            })

    } catch (error) {
        console.error("Error in statisticsView_count. Error: ", error);
        return next(new BadRequest(`Error while fetching popular products`, errorCode.Failed_to_fetch_viewCount))
    }


}

//Fetch products based on sale count
exports.statisticsSale_count = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    try {
        Product.find({ deleted: 0, availableStock: { $gt: 0 } }, { _id: 1, "productName": 1, "coverImage": 1, "saleCount": 1, "availableStock": 1 }).lean()
            .limit(5)
            .sort({ saleCount: -1 }).then(data => {
                data.forEach(product => {
                    product._id = product._id.toString()
                })
                return res.send(data);
            })

    } catch (error) {
        console.error("Error in function statisticsSale_count. Error: ", error);
        return next(new BadRequest(`Error while fetching trending products`, errorCode.Failed_to_fetch_saleCount))
    }
}
//type
exports.addType = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const id = req.params.id;
    let { type } = req.body;
    const exist = await SubCategory.findOne({ _id: id })
    if (exist) {
        const typeId = 'TYPE' + new Date().getTime().toString();
        await SubCategory.findOneAndUpdate({ _id: id, 'type.name': { $ne: type } }, {
            $addToSet: { type: { _id: typeId, name: type } }
        }).then((data) => {
            if (data)
                return res.send({ message: "Type added!" })
            else {
                return next(new BadRequest(`Type already exists!`, errorCode.Type_exist))

            }
        }).catch((error) => {
            return next(new GeneralError(`Error when adding type,  error: ${error}`, 500)
            )
        })
    }
    else {
        return next(new BadRequest(`Subcategory  does not exist with id: ${id}`, errorCode.Subcategory_not_found));
    }
}
exports.updateType = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const id = req.params.id;
    let { type, typeId } = req.body;
    const exist = await SubCategory.findOne({ _id: id })
    if (exist) {
        const typeExistWithId = await SubCategory.findOne(
            { _id: id, type: { $elemMatch: { _id: typeId } } }
        )
        if (!typeExistWithId) {
            return next(new BadRequest(`Type does not exist!`, errorCode.Type_not_found));
        }
        else {
            const typeExist = await SubCategory.findOne(
                { _id: id, type: { $elemMatch: { name: type } } }
            )
            if (typeExist && !await SubCategory.findOne(
                { _id: id, type: { $elemMatch: { _id: typeId, name: type } } }
            )) {
                return next(new BadRequest("Type already exist", errorCode.Type_exist));

            }
            else {
                await SubCategory.updateOne(
                    { _id: id, "type._id": typeId },
                    {
                        $set:
                        {
                            "type.$.name": type
                        },
                    },
                    { arrayFilters: [{ "elem._id": typeId }] }


                ).then((data) => {
                    if (data.modifiedCount > 0)
                        return res.send({ message: "Updated!" })
                    else {
                        return next(new BadRequest(`Type does not exist!`, errorCode.Type_not_found))

                    }
                }).catch((error) => {
                    return next(new GeneralError(`Error when updating type,  error: ${error}`, 500)
                    )
                })
            }

        }
    }

    else {
        return next(new BadRequest(`Subcategory  does not exist with id: ${id}`, errorCode.Subcategory_not_found));
    }
}

exports.deleteType = async (req, res, next) => {
    const id = req.query.id;
    typeId = req.query.typeId;
    let flag = false;
    await Product.findOne({ typeId: typeId }).then((result) => {
        if (result != null) {
            flag = true;
        }
    })
    if (flag) {
        return next(new BadRequest(`Error when deleting type, product exist with given  type`, errorCode.Dependancy_error_type));
    }
    else {
        const updateBody = {
            $pull: { 'type': { _id: typeId } }
        }
        SubCategory.updateOne(
            { _id: id, type: { $elemMatch: { _id: typeId } } }, updateBody
        ).then(response => {
            if (response.modifiedCount === 1)
                return res.send({ message: "Deleted!" });
            else {
                return next(new BadRequest(`Couldn't fetch the  type with given id ${typeId}`, errorCode.Type_not_found))
            };
        }).catch((error) => {
            return next(new GeneralError(`Error when deleting type,  error:${error}`, 500))
        })
    }
}

exports.getUserRewardCoinHistory = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    let userId = String(req.query.userId).toLowerCase()
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

exports.getUsers = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    let { page, size, keyword, createdAt, name, status } = req.query;
    let matchParams = {}
    let sortParams = {}
    if (createdAt) {
        sortParams.createdAt = Number(createdAt)
    }
    else if (name) {
        sortParams.name = Number(name)
    }
    else
        sortParams.createdAt = -1
    if (keyword) {
        matchParams.$or = [
            { name: { $regex: RegexEscape(keyword), $options: 'i' } },
            { _id: { $regex: keyword, $options: 'i' } },
            { email: { $regex: RegexEscape(keyword), $options: 'i' } }
        ]
    }
    if (status) {
        matchParams.status = Number(status)
    }
    let limit = size ? size : 10;
    page = page ? page : 1;
    User.paginate(matchParams, { page, limit, sort: sortParams, collation: { locale: 'en', strength: 2 } }).then(users => {
        return res.send(users)
    })
}

exports.getUserDetail = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new NotFound(errObj.error, errObj.error_Code));
    }
    let userId = req.params.userId;
    User.findOne({ _id: userId }).then(users => {
        return res.send(users)
    })
}

exports.blockUser = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    let userId = String(req.query.userId).toLowerCase()
    let status = req.query.status
    User.findByIdAndUpdate({ _id: userId }, { $set: { status } }).then(user => {
        if (user !== null) {
            if (Number(status) === 0)
                return res.send({ message: "User Blocked Successfully." })
            else
                return res.send({ message: "User Unblocked Successfully." })
        }
        else
            return next(new BadRequest("User not found.", errorCode.User_not_Found))
    })

}

//View Response

exports.viewResponse = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }

    let { page, size, updatedate, keyword, replyStatus } = req.query
    let limit = size ? Number(size) : 10;
    let pageNumber = page ? Number(page) : 1;
    let sortParams = {}
    let matchParams = {}
    let docs = {}
    let result = {}
    let totaldocs = 0
    let totalpages = 0
    let skipValue = (pageNumber - 1) * limit
    sortParams.updatedAt = updatedate ? Number(updatedate) : -1;

    if (keyword) {
        matchParams.$or = [
            { "userName": { $regex: RegexEscape(keyword), $options: 'i' } },
            { "orderId": { $regex: req.query.keyword, $options: 'i' } },
            { "userId": { $regex: req.query.keyword, $options: 'i' } },
        ]
    }
    if (replyStatus) {
        if (Number(replyStatus) === 1)
            matchParams.replyStatus = { $eq: 1 }
        else if (Number(replyStatus) === 0)
            matchParams.replyStatus = { $eq: 0 }
    }

    await ChatBot.aggregate([
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
            $group: {
                _id: '$_id',
                orderId: { $first: { $toString: { $toLong: '$orderId' } } },
                userId: { $first: '$userId' },
                userName: { $first: '$user.name' },
                email: { $first: '$user.email' },
                replyStatus: { $first: '$replyStatus' },
                createdAt: { $first: '$createdAt' },
                updatedAt: { $first: '$updatedAt' },
                message: { $first: '$message' },
                productId: { $first: { $toString: { $toLong: '$productId' } } },
                mailStatus: { $first: '$mailStatus' }

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
                            orderId: 1,
                            message: 1,
                            userName: 1,
                            email: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            userType: 1,
                            replyStatus: 1,
                            productId: 1,
                            mailStatus: 1

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
            docs.forEach(record => {
                record._id = record._id.toString()
            })
            totaldocs = record[0].pagination[0].totalDocs
            totalpages = Math.ceil(totaldocs / limit)
            result = { docs, page: pageNumber, docsInPage: docs.length, totalPages: totalpages, totalDocs: totaldocs }
        }
        res.send(result)
    }).catch(error => {
        return next(new BadRequest(`Error while fetching responses.Error:${error}`, errorCode.Failed_to_fetchResponse))
    })

}

///View single user response
exports.viewResponseDetails = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }

    const id = Long.fromString(req.params.id.toString());
    ChatBot.find({ _id: id })
        .lean().then(chatdetails => {
            if (chatdetails.length === 0) { res.send("No record found") }
            else {
                User.findOne({ _id: chatdetails[0].userId }).then(user => {
                    chatdetails[0].userName = user.name
                    chatdetails[0].orderId = chatdetails[0].orderId.toString()
                    chatdetails[0].productId = chatdetails[0].productId.toString()

                    res.send(chatdetails)
                })
            }

        }).catch(error => {
            console.error(`Failed: ${error}`);
            return next(new BadRequest("Error while fetching response.", errorCode.Failed_to_fetchResponse))
        })

}

exports.blockUser = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    let userId = String(req.query.userId).toLowerCase()
    let status = req.query.status
    User.findByIdAndUpdate({ _id: userId }, { $set: { status } }).then(user => {
        if (user !== null) {
            if (Number(status) === 0)
                return res.send({ message: "User Blocked Successfully." })
            else
                return res.send({ message: "User Unblocked Successfully." })
        }
        else
            return next(new BadRequest("User not found.", errorCode.User_not_Found))
    })

}

///Admin sending the response

exports.addReply = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const id = Long.fromString(req.params.id.toString());

    let { adminResponse } = req.body;

    const chatRecord = await ChatBot.findOne({ _id: id })

    const userId = chatRecord.userId
    const userRecord = await User.findOne({ _id: userId })
    const userEmail = userRecord.email
    const userName = userRecord.name

    if (userRecord) {
        var mailOptions = {
            from: 'suchitra.nair59@gmail.com',
            to: userEmail,
            subject: 'SHOP BY ETH',
            text: "Hi " + userName + ",\n\n" + adminResponse + "\n\nRegards,\n\nAdmin Team"
        };
        if (chatRecord) {
            const updateBody = {
                $push: { 'message': [{ response: adminResponse, userType: 1 }] },
                replyStatus: 1


            }
            ChatBot.findOneAndUpdate({ _id: id }, updateBody).then(response => {

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log("Failed" + error);
                    } else {

                        console.log('Email sent: ' + info.response);
                        let updateReply = {
                            mailStatus: 1
                        }
                        ChatBot.findOneAndUpdate({ _id: id }, updateReply).then(response => {
                            console.log("Updated");

                        })
                    }
                })

                res.status(200).send({ message: "Added successfully" })
            })

                .catch(error => {
                    console.error(`Failed ${error}`);
                    return next(new BadRequest("Error while adding response.", errorCode.Failed_to_addAdminResponse))
                })
        }
        else {
            return next(new BadRequest(`No record found for id ${id}`, errorCode.Invalid_chatId))
        }
    }
    else {
        return next(new BadRequest(`No user found in  ${userId}`, errorCode.User_not_Found))

    }
}


///Upload home images

exports.uploadHomeImage = async (req, res, next) => {
    try {
        uploadfile(req, res, function (error) {
            if (error) {
                console.error("Error while uploading image. Error: ", error)
                return next(new BadRequest("Error while uploading image.", errorCode.Error_while_uploading_image))
            } else {
                return res.status(200).send({ homeImage: req.file.key.replace('images/temp/', '') });
            }
        })
    } catch (error) {
        if (req.file === undefined) {
            return next(new BadRequest("upload file not found.", errorCode.Upload_image_not_found))
        }
        else {
            console.error("Failed", error)
            return next(new GeneralError("An error occurred while uploading home image.", errorCode.Error_while_uploading_image))
        }
    }
}

////delete home image

exports.deleteImage = (req, res, next) => {
    if (req.params.file) {
        try {
            s3.headObject({
                Bucket: awsConfig.bucket,
                Key: 'images/temp/' + req.params.file
            }, function (err, metadata) {
                if (err && err.name === 'NotFound') {
                    return next(new BadRequest("File not found", errorCode.Image_notFound))
                } else if (err) {
                    return next(new BadRequest("Error fetching file.", errorCode.Failed_to_fetchImage))
                } else {
                    s3.deleteObject({
                        Bucket: awsConfig.bucket,
                        Key: 'images/temp/' + req.params.file
                    }).promise()
                        .then(data => {
                            return res.status(200).send({ message: "File deleted successfully" })
                        }).catch(err => {
                            return next(new BadRequest("File not found", errorCode.Image_notFound))
                        })
                }
            });
        }
        catch {
            return next(new BadRequest("File not found", errorCode.Image_notFound))
        }
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
                        // console.error(err);
                        currentIteration = totalImageCount
                        reject({ message: "One or more Image file not found in server.", errorCode: errorCode.Image_notFound });
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
                reject({ message: "One or more Image file not found in server.", errorCode: errorCode.Image_notFound });
            })
        }
    })
}

///////add home image

exports.addHomeImage = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    try {

        s3.listObjects(params, function (error, data) {
            if (error) {
                console.error("Error: ", error, error.stack); // an error occurred
            } else {
                const imageId = Long.fromString(Math.floor(Math.random() * 100).toString() + new Date().getTime().toString())
                let imageCount = 0
                const copyImage = new Promise(async (resolve, reject) => {
                    checkImageExist(req.body.homeImages).then(async () => {
                        for await (const homeImage of req.body.homeImages) {
                            const oldImageFileKey = 'images/temp/' + homeImage
                            const newImageFileKey = `images/${imageId}/` + homeImage
                            await s3.copyObject({
                                Bucket: awsConfig.bucket,
                                CopySource: `${awsConfig.bucket}/${oldImageFileKey}`,
                                Key: newImageFileKey,
                                ACL: 'public-read',
                            }).promise()
                                .then(() => {
                                    imageCount++
                                    if (imageCount === req.body.homeImages.length) {
                                        resolve()
                                    }
                                    s3.deleteObject({
                                        Bucket: awsConfig.bucket,
                                        Key: oldImageFileKey
                                    }).promise()
                                })
                                .catch(error => {
                                    console.error(`Error: ${productImage}`, error)
                                    reject({ message: "Error copying homeImages.", errorCode: errorCode.Failed_to_addImage });
                                })
                        }
                    }).catch((error) => {
                        reject(error)
                    })
                })
                let image = new HomeImage({

                    homeImages: req.body.homeImages,
                    _id: imageId,
                    imageType: req.body.imageType
                })
                copyImage.then(() => {
                    image.save(image)
                        .then(data => {
                            data = data.toObject()
                            data._id = data._id.toString()
                            res.status(200).send(data)
                        })
                        .catch(error => {
                            console.error("Error Error: ", error)
                            return next(new GeneralError("An error occured while adding image.", errorCode.Failed_to_addImage))
                        })
                }).catch((error) => {
                    return next(new BadRequest(error.message, error.errorCode.Failed_to_addImage))
                })
            }
        });
    } catch (error) {
        console.error("An error occured while adding image. Error: ", error)
    }
}

////edit Home page

exports.editHomePage = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const id = Long.fromString(req.params.id.toString())
    let updateBody = {}
    let errorFlag = 0;
    HomeImage.findOne({ _id: id }).then(async currentData => {
        if (currentData !== undefined) {
            let oldHomeImages = currentData.homeImages
            let newHomeImages = req.body.homeImages ? req.body.homeImages : []
            let imageCount = 0
            let copyImages = new Promise(async (resolve, reject) => {
                if (req.body.homeImages) {
                    if (req.body.homeImages.length > 0) {
                        let updateCounter = 0;
                        let newHomeImages = req.body.homeImages
                        let newImagesOnly = newHomeImages.filter(x => !oldHomeImages.includes(x));
                        checkImageExist(newImagesOnly).then(async () => {
                            for await (const newHomeImage of newHomeImages) {
                                if (!oldHomeImages.includes(newHomeImage)) {
                                    const oldImageFileKey = 'images/temp/' + newHomeImage
                                    const newImageFileKey = `homeImages/${id}/` + newHomeImage
                                    await s3.copyObject({
                                        Bucket: awsConfig.bucket,
                                        CopySource: `${awsConfig.bucket}/${oldImageFileKey}`,
                                        Key: newImageFileKey,
                                        ACL: 'public-read',
                                    }).promise()
                                        .then(() => {
                                            imageCount++
                                            if (imageCount === req.body.homeImages.length)
                                                resolve()
                                            updateCounter++
                                            s3.deleteObject({
                                                Bucket: awsConfig.bucket,
                                                Key: oldImageFileKey
                                            }).promise()
                                        })
                                        .catch(error => {
                                            reject({ message: "Error copying images.", errorCode: errorCode.Failed_to_editImage })
                                            console.error(`Error in s3.copyObject (edit homeImages) for image: ${newHomeImage}. Error: `, error)
                                            errorFlag = 1;
                                        })
                                } else {
                                    imageCount++
                                    if (imageCount === req.body.homeImages.length)
                                        resolve()
                                    updateCounter++;
                                }
                            }
                        }).catch((error) => {
                            reject(error)
                        })
                        if (updateCounter === req.body.homeImages.length) {
                            for await (const element of oldHomeImages) {
                                if (!newHomeImages.includes(element)) {
                                    await s3.deleteObject({
                                        Bucket: awsConfig.bucket,
                                        Key: `homeImages/${id}/${element}`
                                    }).promise()
                                }
                            }
                        }
                    }
                }
            })

            if (errorFlag === 0) {
                if (req.body.imageType) {
                    updateBody = {
                        ...updateBody,
                        imageType: req.body.imageType
                    }
                }

                updateBody = {
                    ...updateBody,
                    homeImages: req.body.homeImages
                }
                copyImages.then(() => {
                    HomeImage.findByIdAndUpdate(id, updateBody)
                        .then(data => {
                            return res.send({
                                message:
                                    "Home Image Edited"
                            });
                        });
                }).catch((error) => {
                    return next(error)
                })
            }
        }
        else {
            return next(new BadRequest("Image not found.", errorCode.Image_notFound))
        }
    }).catch(error => {
        console.error("Error fetching image. Error: ", error)
        return next(new GeneralError("Error fetching image", errorCode.Failed_to_fetchImage))
    })
}

exports.getProductPurchaseHistory = (req, res, next) => {
    let { page, size, quantity } = req.query;
    page = page ? page : 1
    let limit = size ? size : 10
    const productId = Long.fromString(req.params.id.toString());
    let sortParams = {
        quantityBought: -1
    }
    if (quantity) {
        sortParams.quantityBought = Number(quantity)
    }
    let aggregateQuery = ([
        { $match: { products: { $elemMatch: { _id: productId } } } },
        { $unwind: '$products' },
        { $match: { 'products._id': productId } },
        {
            $lookup: {
                from: "users",
                localField: 'userId',
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $group: {
                _id: {
                    userId: '$userId',
                    username: { $first: '$user.name' },
                    productId: '$products._id'
                },

                count: { $sum: '$products.productQuantity' }
            }
        },
        {
            $project: {
                _id: 0,
                'userId': '$_id.userId',
                'username': '$_id.username',
                'productId': '$_id.productId',
                'quantityBought': '$count'
            }
        }
    ])

    const productHistoryAggregate = Orders.aggregate(aggregateQuery)
    Orders.aggregatePaginate(productHistoryAggregate, { page, limit, sort: sortParams, collation: { locale: 'en', strength: 2 } }).then(result => {
        return res.send(result)
    }).catch(error => {
        console.error({ Error: "Error while fetching product history. Error: ", error })
        return next(new BadRequest("Error while fetching product history.", errorCode.Error_fetching_product_history))
    })
}



