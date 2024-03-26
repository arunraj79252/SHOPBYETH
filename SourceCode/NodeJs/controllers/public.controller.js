const { validationResult } = require('express-validator');
const db = require("../models");
const Product = db.product;
const { BadRequest, GeneralError } = require('../utils/errors')
const errorCode = require('../utils/error-code.utils.js');
const Category = db.category;
const User = db.user;
const Brand = db.brand;
const Subcategory = db.subCategory;
const Long = require('mongodb').Long
const HomeImage = db.homeImage
const RegexEscape = require("regex-escape");

exports.getProducts = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    try {
        let { page, size, views, sales, avgRating, rating, gender, createdAt, brand, price, category, subCategory, keyword, priceRange, typeId, outOfStock } = req.query
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
        }
        if (outOfStock) {
            if (Number(outOfStock) === 1)
                matchParams.availableStock = { $eq: 0 }
            else if (Number(outOfStock) === 0)
                matchParams.availableStock = { $gt: 0 }
        }
        if (brand) {
            brand = brand.replaceAll(' ', '');
            let brands = brand.split(',')
            matchParams.brandId = { $in: brands }
        }
        if (rating) {
            matchParams.$expr = { $gte: [{ $avg: '$feedback.rating' }, Number(rating)] }
        }
        if (keyword) {
            matchParams.$or = [
                { "productName": { $regex: RegexEscape(keyword), $options: 'i' } },
            ]
        }
        if (category) {
            matchParams.categoryId = category
            if (subCategory) {
                let notfound = []
                let flag = 0
                subCategory = subCategory.replaceAll(' ', '');
                let subcategories = subCategory.split(',')
                matchParams.subCategoryId = { $in: subcategories }
                if (typeId) {
                    typeId = typeId.replaceAll(' ', '');
                    let types = typeId.split(',')
                    matchParams.typeId = { $in: types }
                }
            }
        }
        if (priceRange) {
            let range = priceRange.split(',')
            matchParams.$and = [
                { price: { $gte: Number(range[0]) } },
                { price: { $lte: Number(range[1]) } }
            ]
        }
        let projection = {
            productName: 1,
            price: 1,
            originalPrice: 1,
            availableStock: 1,
            categoryId: 1,
            subCategoryId: 1,
            brandId: 1,
            typeId: 1,
            coverImage: 1,
            viewCount: 1,
            saleCount: 1,
            gender: 1,
            'averageRating': { $avg: '$feedback.rating' },
            'ratingCount': { $size: '$feedback' }
        }
        Product.paginate(matchParams, { page, limit, sort: sortParams, collation: { locale: 'en', strength: 2 }, projection, lean: true })
            .then(result => {
                result.docs.forEach(product => {
                    product._id = product._id.toString()
                })
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
            availableStock: 1,
            coverImage: 1,
            productImages: 1,
            gender: 1,
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
                    Product.updateOne({ _id: id }, { $inc: { viewCount: 1 } }).then(() => {
                        return res.status(200).send(product)
                    })
                });
            }
            else {
                return next(new BadRequest("Product not available", errorCode.Product_not_available))
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

exports.getCategories = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    let { page, size, keyword, createdAt, key } = req.query;
    let totalDoc = await Category.find().count()
    let limit = size ? Number(size) : totalDoc;
    page = page ? Number(page) : 1;
    key = key ? Number(key) : 0;
    let matchParams = {}
    let sortParams = {
        createdAt: createdAt ? Number(createdAt) : -1
    }
    if (keyword) {
        if (key === 1)
            matchParams.$or = [
                { "name": { $regex: RegexEscape(keyword), $options: 'i' } },
                { "_id": { $regex: req.query.keyword, $options: 'i' } }
            ]
        else
            matchParams.$or = [
                { "name": { $regex: RegexEscape(keyword), $options: 'i' } }
            ]
    }
    let projection = {
        _id: 1,
        name: 1
    }

    await Category.paginate(matchParams, { page, limit, projection, sort: sortParams, lean: true }).then((data) => {
        res.send(data);
    }).catch((error) => {
        return next(new GeneralError(`Error while fetching categories,  error:${error}`, errorCode.Error_fetching_categories))
    })

}

exports.getSubCategories = async (req, res, next) => {
    await Category.findOne({ _id: req.params.id }).then(async (data) => {

        if (data) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                let errObj = errors.errors[0].msg;
                return next(new BadRequest(errObj.error, errObj.error_Code));
            }
            let { page, size, keyword, createdAt, key } = req.query;
            let totalDoc = await Subcategory.find({ categoryId: req.params.id }).count()
            let limit = size ? Number(size) : totalDoc;
            page = page ? Number(page) : 1;
            key = key ? Number(key) : 0;
            let matchParams = {}
            let sortParams = {
                createdAt: createdAt ? Number(createdAt) : -1
            }
            matchParams.categoryId = req.params.id;
            if (keyword) {
                if (key === 1)
                    matchParams.$or = [
                        { "name": { $regex: RegexEscape(keyword), $options: 'i' } },
                        { "_id": { $regex: req.query.keyword, $options: 'i' } }
                    ]
                else
                    matchParams.$or = [
                        { "name": { $regex: RegexEscape(keyword), $options: 'i' } }
                    ]
            }
            let projection = {
                _id: 1,
                name: 1
            }

            Subcategory.paginate(matchParams, { page, limit, projection, sort: sortParams, lean: true }).then((data) => {
                res.send(data);
            }).catch((error) => {
                return next(new GeneralError(`Error while fetching Subcategories,  error:${error}`, errorCode.Error_fetching_subcategories))
            })
        }
        else {
            next(new BadRequest(`Invalid category or Category not found!`, errorCode.Category_not_found))
        }
    }).catch((error) => {
        return next(new GeneralError(`Error while fetching category,  error:${error}`, errorCode.Error_fetching_categories))
    })
}

exports.listBrand = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    let { page, size, keyword, createdAt, key } = req.query;
    let totalDoc = await Brand.find().count()
    let limit = size ? Number(size) : totalDoc;
    page = page ? Number(page) : 1;
    key = key ? Number(key) : 0;
    let matchParams = {}
    let sortParams = {
        createdAt: createdAt ? Number(createdAt) : -1
    }
    if (keyword) {
        if (key === 1)
            matchParams.$or = [
                { "name": { $regex: RegexEscape(keyword), $options: 'i' } },
                { "_id": { $regex: req.query.keyword, $options: 'i' } }
            ]
        else
            matchParams.$or = [
                { "name": { $regex: RegexEscape(keyword), $options: 'i' } }
            ]
    }
    let projection = {
        _id: 1,
        name: 1
    }
    await Brand.paginate(matchParams, { page, limit, projection, sort: sortParams, lean: true }).then((data) => {
        res.send(data);
    }).catch((error) => {
        return next(new GeneralError(`Error while fetching brands,  error:${error}`, errorCode.Error_fetching_brands))
    })
}

exports.getProductInfo = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    let productIds = req.body.productIds;
    productIds.forEach(productId => {
        productId = Long.fromString(productId.toString())
    })
    Product.find({ _id: { $in: productIds } }, "availableStock price").lean().then(products => {
        products.forEach(product => {
            product._id = product._id.toString()
        })
        return res.send(products)
    }).catch(error => {
        console.error(`Cannot fetch products: ${productIds}. Error: ${error}`)
        return next(new GeneralError("Error fetching products.", errorCode.Error_fetching_products))
    })
}

exports.viewProductReviews = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    let productId = Long.fromString(req.params.id.toString())
    let projection = {
        feedback: 1,
        _id: 0,
        'averageRating': { $avg: '$feedback.rating' },
        'totalRatings': { $size: '$feedback' }
    }
    let ratingInfo = {}
    let count = 1
    Product.findOne({ _id: productId, deleted: 0 }, projection).lean().then(product => {
        if (product) {
            ratingInfo.averageRating = product.averageRating != null ? product.averageRating : 0
            ratingInfo.totalRatings = product.totalRatings
            ratingInfo.ratings = {
                fiveStar: 0,
                fourStar: 0,
                threeStar: 0,
                twoStar: 0,
                oneStar: 0
            }
            const getRatings = new Promise((resolve, reject) => {
                if (product.feedback.length > 0) {
                    product.feedback.forEach(feedback => {
                        User.findOne({ _id: feedback.userId }).then(user => {
                            if (user)
                                feedback.userName = user.name
                            else
                                feedback.userName = "Not Available"

                            switch (feedback.rating) {
                                case 5:
                                    ratingInfo.ratings.fiveStar++
                                    break;
                                case 4:
                                    ratingInfo.ratings.fourStar++
                                    break;
                                case 3:
                                    ratingInfo.ratings.threeStar++
                                    break;
                                case 2:
                                    ratingInfo.ratings.twoStar++
                                    break;
                                case 1:
                                    ratingInfo.ratings.oneStar++
                                    break;
                                default: break;
                            }
                            if (count === product.feedback.length) {
                                resolve(ratingInfo)
                            }
                            else
                                count++
                        })
                            .catch(error => {
                                console.error(`Error fetching user info. Error: ${error}`)
                                reject("Error fetching user info.", errorCode.Error_fetching_user)
                            })
                    })
                }
                else {
                    resolve(ratingInfo)
                }
            })
            getRatings.then((ratingInfo) => {
                const response = { ...product, ...ratingInfo }
                res.send(response)
            }).catch(error => {
                return next(new GeneralError(error))
            })
        }
        else {
            return next(new BadRequest("Product not available.", errorCode.Product_not_available))
        }
    }).catch(error => {
        console.error(`Error occured while fetching product: ${productId}. Error: ${error}`)
        return next(new GeneralError("Error fetching product.", errorCode.Failed_fetching_product))
    })
}

exports.listType = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const id = req.params.id;
    await Subcategory.findOne({ _id: id }, { type: 1, _id: 0 })
        .then((data) => {
            if (data)
                return res.send(data.type);
            else {
                return next(new BadRequest("Invalid Subcategory!", errorCode.Subcategory_not_found))

            }
        }).catch((error) => {
            return next(new GeneralError(`Error when fetching type,  error: ${error}`, 500)
            )
        })
}

//similar products
exports.listSimilarProducts = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    try {

        let productId = req.params.id;
        let product = await Product.findById(productId);
        let matchParams = { deleted: 0 }
        matchParams._id = { $ne: product._id }
        matchParams.gender = { $in: [product.gender, 0] }
        matchParams.categoryId = product.categoryId;
        matchParams.subCategoryId = product.subCategoryId;
        matchParams.typeId = product.typeId
        matchParams.availableStock = { $gt: 0 }
        matchParams.$and = [
            { price: { $gte: Number(product.price) - 100 } },
            { price: { $lte: Number(product.price) + 100 } }
        ]
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
        Product.paginate(matchParams, { page: 1, limit: 20, sort: { saleCount: -1 }, collation: { locale: 'en', strength: 2 }, projection, lean: true })
            .then(result => {
                res.send(result);
            }).catch(error => {
                console.error({ Error: "Error while fetching products. Error: ", error })
                return next(new BadRequest("Error while fetching products.", errorCode.Failed_fetching_product));
            })

    } catch (error) {
        console.error("Error : ", error)
        return next(new BadRequest("Error while fetching products.", errorCode.Failed_fetching_product))
    }
}

exports.listFeedbacks = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    let { page, size, rating, date } = req.query
    let productId = Long.fromString(req.params.id.toString())
    let limit = size ? Number(size) : 10;
    let pageNumber = page ? Number(page) : 1;
    date = date ? Number(date) : -1;
    let sortParams = {}
    let docs = {}
    let result = {}
    let totaldocs = 0
    let totalpages = 0
    let skipValue = (pageNumber - 1) * limit
    if (rating) {
        sortParams = { 'feedback.rating': Number(rating) }
    }
    else if (date) {
        sortParams = { 'feedback.date': date }
    }
    Product.aggregate([

        {
            $match: {
                _id: productId
            }
        },
        { $unwind: '$feedback' },
        {
            $lookup: {
                from: "users",
                localField: "feedback.userId",
                foreignField: "_id",
                as: "user"
            }
        },
        {

            $facet: {
                docs: [
                    {
                        $project: {
                            _id: 0,
                            feedback: 1,
                            "user.name": 1
                        }
                    },
                    { $sort: sortParams },
                    { $skip: skipValue },
                    { $limit: limit },
                ],
                ratingInfo: [
                    { $addFields: { averageRating: { $avg: "rating" } } },
                    { $addFields: { Rating1: { $sum: "rating" } } },
                    { $addFields: { page: pageNumber } },

                ],
                pagination: [
                    { $count: "totalDocs" },
                    { $addFields: { page: pageNumber } },

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
            totaldocs = record[0].pagination[0].totalDocs
            totalpages = Math.ceil(totaldocs / limit)
            pagination = { page: pageNumber, docsInPage: docs.length, totalPages: totalpages, totalDocs: totaldocs }
            result = { docs, pagination }
        }
        res.send(result)
    }).catch(error => {
        return next(new BadRequest(`Error while fetching orders.Error:${error}`, errorCode.Failed_fetching_orders))
    })
}

//Get home page
exports.getHomeImage = async (req, res, next) => {
    await HomeImage.aggregate([
        {
            $project: {
                _id: 1,
                imageType: 1,
                homeImages: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        },
    ]).then(record => {
        if (record.length === 0) {
            res.send([])
        }
        else {
            res.send(record)
        }
    }).catch(error => {
        return next(new BadRequest(`Error while fetching images.Error:${error}`, errorCode.Failed_to_fetchImage))
    })

}

//View single image details
exports.viewImageDetails = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }
    const id = Long.fromString(req.params.id.toString());
    HomeImage.find({ _id: id }).lean().then(imagedetails => {
        if (imagedetails.length === 0) { res.send("No record found") }
        else {
            res.send(imagedetails)
        }
    }).catch(error => {
        console.error(`Failed: ${error}`);
        return next(new BadRequest("Error while fetching image details.", errorCode.Failed_to_fetchImage))
    })

}