const { body, query, param } = require('express-validator')
const db = require('../models');
const errorCode = require('../utils/error-code.utils');
const orderStatusUtils = require('../utils/order-status.utils');
const paymentStatusUtils = require('../utils/payment-status.utils');
const User = db.user;
const Order = db.orders;
const Category = db.category;
const SubCategory = db.subCategory;
const ChatBot = db.chatBot;
const Brand = db.brand;
const Product = db.product;
const HomeImage = db.homeImage


const Long = require('mongodb').Long
const adminValidator = (validationtype) => {
    switch (validationtype) {

        case 'addProduct': {
            return [
                body('productName')
                    .exists()
                    .withMessage({ error: "No product name entered", error_Code: errorCode.Invalid_product_name })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product name entered", error_Code: errorCode.Invalid_product_name })
                    .isLength({ min: 2 })
                    .withMessage({ error: "Product Name too short.", error_Code: errorCode.Product_name_too_short })
                    .isLength({ max: 300 })
                    .withMessage({ error: "Product Name too long.", error_Code: errorCode.Product_name_too_long }),

                body('description')
                    .exists()
                    .withMessage({ error: "No product description entered", error_Code: errorCode.Invalid_product_description })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product description entered", error_Code: errorCode.Invalid_product_description })
                    .isLength({ min: 2 })
                    .withMessage({ error: "Product Description too short.", error_Code: errorCode.Product_description_too_short })
                    .isLength({ max: 5000 })
                    .withMessage({ error: "Product Description too long.", error_Code: errorCode.Product_description_too_long }),

                body('categoryId')
                    .exists()
                    .withMessage({ error: "No product categoryId entered", error_Code: errorCode.Invalid_product_categoryId })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product categoryId entered", error_Code: errorCode.Invalid_product_categoryId })
                    .custom(value => {
                        return Category.find({ _id: value }).count().then(categoryCount => {
                            if (categoryCount > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Category not found!", error_Code: errorCode.Category_not_found }),

                body('subCategoryId')
                    .exists()
                    .withMessage({ error: "No product subCategoryId entered", error_Code: errorCode.Invalid_product_subCategoryId })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product subCategoryId entered", error_Code: errorCode.Invalid_product_subCategoryId })
                    .custom((value, { req }) => {
                        return SubCategory.find({ _id: value, categoryId: req.body.categoryId }).count().then(subCategoryCount => {
                            if (subCategoryCount > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Subcategory not found!", error_Code: errorCode.Subcategory_not_found }),

                body('brandId')
                    .exists()
                    .withMessage({ error: "No product brandId entered", error_Code: errorCode.Invalid_product_brandId })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product brandId entered", error_Code: errorCode.Invalid_product_brandId })
                    .custom(value => {
                        return Brand.find({ _id: value }).count().then(brandCount => {
                            if (brandCount > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Brand not found!", error_Code: errorCode.Brand_not_found }),

                body('originalPrice')
                    .exists()
                    .withMessage({ error: "No product original price entered", error_Code: errorCode.Invalid_product_original_price })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product original price entered", error_Code: errorCode.Invalid_product_original_price })
                    .isFloat({ min: 0.001 })
                    .withMessage({ error: "Entered Original price should not fall below 0.001.", error_Code: errorCode.Invalid_original_price_parameter })
                    .custom(value => (typeof value === 'number'))
                    .withMessage({ error: "Entered Original price is not a positive float number.", error_Code: errorCode.Invalid_original_price_parameter })
                    .custom(value => {
                        let price = value.toString().split(".")
                        if (price[1])
                            return price[1].length <= 3;
                        else
                            return true;
                    })
                    .withMessage({ error: "Original price value cannot accept more than 3 digits after decimal point.", error_Code: errorCode.Original_price_value_exceeds_limit })
                    .bail()
                    .custom(value => {
                        let price = value.toString().split(".")
                        return price[0].length <= 8;
                    })
                    .withMessage({ error: "Original price value cannot accept more than 8 digits before decimal point.", error_Code: errorCode.Original_price_value_exceeds_limit }),

                body('price')
                    .exists()
                    .withMessage({ error: "No product price entered", error_Code: errorCode.Invalid_product_price })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product price entered", error_Code: errorCode.Invalid_product_price })
                    .isFloat({ min: 0.001 })
                    .withMessage({ error: "Entered price should not fall below 0.001.", error_Code: errorCode.Invalid_price_paramter })
                    .custom(value => (typeof value === 'number'))
                    .withMessage({ error: "Entered price is not a positive float number.", error_Code: errorCode.Invalid_price_paramter })
                    .bail()
                    .custom((value, { req }) => Number(value) <= Number(req.body.originalPrice))
                    .withMessage({ error: "Price should be less than original price.", error_Code: errorCode.Price_greater_than_original_price })
                    .bail()
                    .custom(value => {
                        let price = value.toString().split(".")
                        if (price[1])
                            return price[1].length <= 3;
                        else
                            return true;
                    })
                    .withMessage({ error: "Price value cannot accept more than 3 digits after decimal point.", error_Code: errorCode.Price_value_exceeds_limit })
                    .bail()
                    .custom(value => {
                        let price = value.toString().split(".")
                        return price[0].length <= 8;
                    })
                    .withMessage({ error: "Price value cannot accept more than 8 digits before decimal point.", error_Code: errorCode.Price_value_exceeds_limit }),

                body('availableStock')
                    .exists()
                    .withMessage({ error: "No product availableStock entered", error_Code: errorCode.Invalid_available_stock })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product availableStock entered", error_Code: errorCode.Invalid_available_stock })
                    .isInt({ min: 0 })
                    .withMessage({ error: "Invalid available stock value", error_Code: errorCode.Invalid_available_stock })
                    .custom(value => (typeof value === 'number'))
                    .withMessage({ error: "Invalid available stock value", error_Code: errorCode.Invalid_available_stock }),

                body('coverImage')
                    .exists()
                    .withMessage({ error: "No product coverImage provided", error_Code: errorCode.Invalid_cover_image })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product coverImage provided", error_Code: errorCode.Invalid_cover_image })
                    .isString()
                    .withMessage({ error: "Invalid product coverImage", error_Code: errorCode.Invalid_cover_image }),

                body('productImages')
                    .exists()
                    .withMessage({ error: "No product images provided", error_Code: errorCode.No_product_image_specified })
                    // .notEmpty({ ignore_whitespace: true })
                    // .withMessage({ error: "No product images provided", error_Code: errorCode.No_product_image_specified })
                    .isArray()
                    .withMessage({ error: "Invalid product images type.", error_Code: errorCode.Invalid_product_image_type })
                    .custom(value => {
                        return (value.length >= 3)
                    })
                    .withMessage({ error: "Should contain atleast 3 images in product images.", error_Code: errorCode.No_product_image_specified })
                    .custom(value => {
                        return (value.length <= 6)
                    })
                    .withMessage({ error: "Should not contain more than 6 images in product images.", error_Code: errorCode.Should_not_contain_more_than_10_images })
                    .bail()
                    .custom(value => {
                        return new Set(value).size === value.length
                    })
                    .withMessage({ error: "Product images should not contain duplicate image names.", error_Code: errorCode.Duplicate_images_not_allowed })
                    .custom((value, { req }) => {
                        return (value.includes(req.body.coverImage))
                    })
                    .withMessage({ error: "Selected cover image not in existing product images.", error_Code: errorCode.Image_does_not_exist }),
                // .custom(value => value[0].notEmpty({ ignore_whitespace: true }))
                // .withMessage({ error: "Should contain at least one image in product images.", error_Code: errorCode.Atleast_one_image_needed }),

                body('specifications')
                    .exists()
                    .withMessage({ error: "No product specification entered", error_Code: errorCode.Invalid_product_specification })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product specification entered", error_Code: errorCode.Invalid_product_specification })
                    .isObject()
                    .withMessage({ error: "Product specifications must be an object.", error_Code: errorCode.Invalid_product_specification })
                    .custom(value => Object.keys(value).length >= 3)
                    .withMessage({ error: "Specification must contain at least 3 key-value pairs.", error_Code: errorCode.Invalid_product_specification }),

                body('gender')
                    .exists()
                    .withMessage({ error: "No product gender entered", error_Code: errorCode.Invalid_gender_parameter })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product gender entered", error_Code: errorCode.Invalid_gender_parameter })
                    .isInt({ min: 0, max: 5 })
                    .withMessage({ error: 'Invalid Gender parameter. Should be positive integer starting from zero.', error_Code: errorCode.Invalid_gender_parameter })
                    .custom(value => (typeof value === 'number'))
                    .withMessage({ error: 'Invalid Gender parameter. Should be positive integer starting from zero.', error_Code: errorCode.Invalid_gender_parameter }),

                body('typeId')
                    .exists()
                    .withMessage({ error: "No product typeId entered", error_Code: errorCode.Invalid_product_typeId })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product typeId entered", error_Code: errorCode.Invalid_product_typeId })
                    .custom((value, { req }) => {
                        return SubCategory.findOne({ _id: req.body.subCategoryId }).then(subCategory => {
                            if (subCategory !== null) {
                                let index = 0
                                while (index !== subCategory.type.length) {
                                    if (subCategory.type[index].id === value)
                                        return Promise.resolve()
                                    else {
                                        index++
                                        if (index === subCategory.type.length) {
                                            return Promise.reject()
                                        }
                                    }
                                }
                            }
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Type not found!", error_Code: errorCode.Type_not_found }),
            ]
        }

        case 'editProduct': {
            return [
                body('productName')
                    .exists()
                    .withMessage({ error: "No product name entered", error_Code: errorCode.Invalid_product_name })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product name entered", error_Code: errorCode.Invalid_product_name })
                    .isLength({ min: 2 })
                    .withMessage({ error: "Product Name too short.", error_Code: errorCode.Product_name_too_short })
                    .isLength({ max: 300 })
                    .withMessage({ error: "Product Name too long.", error_Code: errorCode.Product_name_too_long }),

                body('description')
                    .exists()
                    .withMessage({ error: "No product description entered", error_Code: errorCode.Invalid_product_description })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product description entered", error_Code: errorCode.Invalid_product_description })
                    .isLength({ min: 2 })
                    .withMessage({ error: "Product Description too short.", error_Code: errorCode.Product_description_too_short })
                    .isLength({ max: 5000 })
                    .withMessage({ error: "Product Description too long.", error_Code: errorCode.Product_description_too_long }),

                body('categoryId')
                    .exists()
                    .withMessage({ error: "No product categoryId entered", error_Code: errorCode.Invalid_product_categoryId })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product categoryId entered", error_Code: errorCode.Invalid_product_categoryId })
                    .custom(value => {
                        return Category.find({ _id: value }).count().then(categoryCount => {
                            if (categoryCount > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Category not found!", error_Code: errorCode.Category_not_found }),

                body('subCategoryId')
                    .exists()
                    .withMessage({ error: "No product subCategoryId entered", error_Code: errorCode.Invalid_product_subCategoryId })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product subCategoryId entered", error_Code: errorCode.Invalid_product_subCategoryId })
                    .custom(value => {
                        return SubCategory.find({ _id: value }).count().then(subCategoryCount => {
                            if (subCategoryCount > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Subcategory not found!", error_Code: errorCode.Subcategory_not_found }),

                body('brandId')
                    .exists()
                    .withMessage({ error: "No product brandId entered", error_Code: errorCode.Invalid_product_brandId })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product brandId entered", error_Code: errorCode.Invalid_product_brandId })
                    .custom(value => {
                        return Brand.find({ _id: value }).count().then(brandCount => {
                            if (brandCount > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Brand not found!", error_Code: errorCode.Brand_not_found }),

                body('originalPrice')
                    .exists()
                    .withMessage({ error: "No product original price entered", error_Code: errorCode.Invalid_product_original_price })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product original price entered", error_Code: errorCode.Invalid_product_original_price })
                    .isFloat({ min: 0.001 })
                    .withMessage({ error: "Original price should not fall below 0.001.", error_Code: errorCode.Invalid_original_price_parameter })
                    .custom(value => (typeof value === 'number'))
                    .withMessage({ error: "Original price not a positive float number", error_Code: errorCode.Invalid_original_price_parameter })
                    .custom(value => {
                        let price = value.toString().split(".")
                        if (price[1])
                            return price[1].length <= 3;
                        else
                            return true;
                    })
                    .withMessage({ error: "Original price value cannot accept more than 3 digits after decimal point.", error_Code: errorCode.Original_price_value_exceeds_limit })
                    .bail()
                    .custom(value => {
                        let price = value.toString().split(".")
                        return price[0].length <= 8;
                    })
                    .withMessage({ error: "Original price value cannot accept more than 8 digits before decimal point.", error_Code: errorCode.Original_price_value_exceeds_limit }),

                body('price')
                    .exists()
                    .withMessage({ error: "No product price entered", error_Code: errorCode.Invalid_product_price })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product price entered", error_Code: errorCode.Invalid_product_price })
                    .isFloat({ min: 0.001 })
                    .withMessage({ error: "price should not fall below 0.001", error_Code: errorCode.Invalid_price_paramter })
                    .custom(value => (typeof value === 'number'))
                    .withMessage({ error: "price not a positive float number", error_Code: errorCode.Invalid_price_paramter })
                    .bail()
                    .custom((value, { req }) => Number(value) <= Number(req.body.originalPrice))
                    .withMessage({ error: "Price should be less than original price.", error_Code: errorCode.Price_greater_than_original_price, value: body('price') })
                    .custom(value => {
                        let price = value.toString().split(".")
                        if (price[1])
                            return price[1].length <= 3;
                        else
                            return true;
                    })
                    .withMessage({ error: "Price value cannot accept more than 3 digits after decimal point.", error_Code: errorCode.Price_value_exceeds_limit })
                    .bail()
                    .custom(value => {
                        let price = value.toString().split(".")
                        return price[0].length <= 8;
                    })
                    .withMessage({ error: "Price value cannot accept more than 8 digits before decimal point.", error_Code: errorCode.Price_value_exceeds_limit }),

                body('availableStock')
                    .exists()
                    .withMessage({ error: "No product availableStock entered", error_Code: errorCode.Invalid_available_stock })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product availableStock entered", error_Code: errorCode.Invalid_available_stock })
                    .isInt({ min: 0 })
                    .withMessage({ error: "Invalid available stock value", error_Code: errorCode.Invalid_available_stock })
                    .custom(value => (typeof value === 'number'))
                    .withMessage({ error: "Invalid available stock value", error_Code: errorCode.Invalid_available_stock }),

                body('coverImage')
                    .exists()
                    .withMessage({ error: "No product coverImage provided", error_Code: errorCode.Invalid_cover_image })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product coverImage provided", error_Code: errorCode.Invalid_cover_image })
                    .isString()
                    .withMessage({ error: "Invalid product coverImage", error_Code: errorCode.Invalid_cover_image }),

                body('productImages')
                    .exists()
                    .withMessage({ error: "No product images provided", error_Code: errorCode.No_product_image_specified })
                    // .notEmpty({ ignore_whitespace: true })
                    // .withMessage({ error: "No product images provided", error_Code: errorCode.No_product_image_specified })
                    .isArray()
                    .withMessage({ error: "Invalid product images type.", error_Code: errorCode.Invalid_product_image_type })
                    .custom(value => {
                        return (value.length >= 3)
                    })
                    .withMessage({ error: "Should contain atleast 3 images in product images.", error_Code: errorCode.No_product_image_specified })
                    .custom(value => {
                        return (value.length <= 6)
                    })
                    .withMessage({ error: "Should not contain more than 6 images in product images.", error_Code: errorCode.Should_not_contain_more_than_10_images })
                    .bail()
                    .custom(value => {
                        return new Set(value).size === value.length
                    })
                    .withMessage({ error: "Product images should not contain duplicate image names.", error_Code: errorCode.Duplicate_images_not_allowed })
                    .custom((value, { req }) => {
                        return (value.includes(req.body.coverImage))
                    })
                    .withMessage({ error: "Selected cover image not in existing product images.", error_Code: errorCode.Image_does_not_exist }),

                body('specifications')
                    .exists()
                    .withMessage({ error: "No product specification entered", error_Code: errorCode.Invalid_product_specification })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product specification entered", error_Code: errorCode.Invalid_product_specification })
                    .isObject()
                    .withMessage({ error: "Product specifications must be an object.", error_Code: errorCode.Invalid_product_specification })
                    .custom(value => Object.keys(value).length >= 3)
                    .withMessage({ error: "Specification must contain at least 3 key-value pairs.", error_Code: errorCode.Invalid_product_specification }),

                body('gender')
                    .exists()
                    .withMessage({ error: "No product gender entered", error_Code: errorCode.Invalid_gender_parameter })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product gender entered", error_Code: errorCode.Invalid_gender_parameter })
                    .isInt({ min: 0, max: 5 })
                    .withMessage({ error: 'Invalid Gender parameter. Should be positive integer starting from zero.', error_Code: errorCode.Invalid_gender_parameter })
                    .custom(value => (typeof value === 'number'))
                    .withMessage({ error: 'Invalid Gender parameter. Should be positive integer starting from zero.', error_Code: errorCode.Invalid_gender_parameter }),

                body('typeId')
                    .exists()
                    .withMessage({ error: "No product typeId entered", error_Code: errorCode.Invalid_product_typeId })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product typeId entered", error_Code: errorCode.Invalid_product_typeId })
                    .custom((value, { req }) => {
                        return SubCategory.findOne({ _id: req.body.subCategoryId }).then(subCategory => {
                            if (subCategory !== null) {
                                let index = 0
                                while (index !== subCategory.type.length) {
                                    if (subCategory.type[index].id === value)
                                        return Promise.resolve()
                                    else {
                                        index++
                                        if (index === subCategory.type.length) {
                                            return Promise.reject()
                                        }
                                    }
                                }
                            }
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Type not found!", error_Code: errorCode.Type_not_found }),
            ]
        }

        case 'getOrders': {
            return [
                param("id")
                    .optional()
                    .isInt()
                    .withMessage({ error: "Please enter valid orderId", error_Code: errorCode.Invalid_OrderId }),
                query('page')
                    .optional()
                    .isInt({ min: 1 })
                    .withMessage({ error: 'Invalid Page Number. Should be a positive integer starting from one.', error_Code: errorCode.Invalid_page_Number }),
                query('size')
                    .optional()
                    .isInt({ min: 1 })
                    .withMessage({ error: 'Invalid Page Size. Should be a positive integer starting from one.', error_Code: errorCode.Invalid_page_size }),
                query('createdate')
                    .optional()
                    .isIn([1, -1])
                    .withMessage({ error: 'Invalid CreateDate parameter. Should be -1 or 1', error_Code: errorCode.Invalid_updateDate_parameter }),
                query('orderstat')
                    .optional()
                    .isInt({ min: 0, max: 11 })
                    .withMessage({ error: 'Invalid OrderStatus parameter. Should be positive integer starting from zero to eleven', error_Code: errorCode.Invalid_orderstatus_parameter }),
                query('paystat')
                    .optional()
                    .isInt({ min: paymentStatusUtils.waitingForPayment, max: paymentStatusUtils.paymentFailed })
                    .withMessage({ error: 'Invalid PaymentStatus parameter. Should be positive integer starting from zero to two', error_Code: errorCode.Invalid_paymentstatus_parameter }),
            ]
        }

        case 'brandValidator': {
            return [
                body('name')
                    .exists()
                    .withMessage({ error: 'Brand name required!', error_Code: errorCode.Brand_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Brand cannot be empty!', error_Code: errorCode.Brand_cannot_empty })
                    .isString()
                    .withMessage({ error: 'Invalid Brand name! ', error_Code: errorCode.Invalid_brand })
                    .isLength({ min: 2 })
                    .withMessage({ error: " Brand name is too short.", error_Code: errorCode.Brand_too_short })
                    .isLength({ max: 30 })
                    .withMessage({ error: "Brand name is too long.", error_Code: errorCode.Brand_too_long }),
            ]
        }


        case 'typeValidator': {
            return [
                body('type')
                    .exists()
                    .withMessage({ error: 'Type is required!', error_Code: errorCode.Type_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Type  cannot be empty!', error_Code: errorCode.Type_cannot_empty })
                    .isString()
                    .withMessage({ error: 'Invalid Type name!', error_Code: errorCode.Invalid_type })
                    .isLength({ min: 2 })
                    .withMessage({ error: " Type name is too short.", error_Code: errorCode.Type_too_short })
                    .isLength({ max: 30 })
                    .withMessage({ error: "Type name is too long.", error_Code: errorCode.Type_too_long }),
            ]
        }

        case 'userStatusValidator': {
            return [
                query('userId')
                    .exists()
                    .withMessage({ error: "No userId specified.", error_Code: errorCode.User_id_required })
                    .custom((value) => {
                        return User.find({ _id: value.toLowerCase() }).count().then(count => {
                            if (count > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "User not found", error_Code: errorCode.User_not_Found }),

                query('status')
                    .exists()
                    .withMessage({ error: "No status parameter specified.", error_Code: errorCode.No_status_parameter })
                    .isInt({ min: 0, max: 1 })
                    .withMessage({ error: "Status parameter should be either 0 or 1", error_Code: errorCode.Invalid_status_parameter }),
            ]
        }

        case 'getUsers': {
            return [
                query('page')
                    .optional()
                    .isInt({ min: 1 })
                    .withMessage({ error: "Page parameter should start with 1.", error_Code: errorCode.Invalid_page_Number }),
                query('size')
                    .optional()
                    .isInt({ min: 1 })
                    .withMessage({ error: "Minimum size parameter should be 1", error_Code: errorCode.Invalid_page_size }),
                query('status')
                    .optional()
                    .isInt({ min: 0, max: 1 })
                    .withMessage({ error: "Status parameter should be either 0 or 1", error_Code: errorCode.Invalid_status_parameter }),
                query('name')
                    .optional()
                    .isIn([1, -1])
                    .withMessage({ error: "Name parameter should be either -1 or 1", error_Code: errorCode.Invalid_sort_parameter }),
                query('createdAt')
                    .optional()
                    .isIn([1, -1])
                    .withMessage({ error: "CreatedAt parameter should be either -1 or 1", error_Code: errorCode.Invalid_sort_parameter }),
            ]
        }

        case 'userId': {
            return [
                param('userId')
                    .custom((value) => {
                        return User.find({ _id: value }).count().then(count => {
                            if (count > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "User not found", error_Code: errorCode.User_not_Found })
            ]
        }

        case 'userIdQuery': {
            return [
                query('userId')
                    .exists()
                    .withMessage({ error: "No userId specified.", error_Code: errorCode.User_id_required })
                    .custom((value) => {
                        return User.find({ _id: value.toLowerCase() }).count().then(count => {
                            if (count > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "User not found", error_Code: errorCode.User_not_Found })
            ]
        }

        case 'orderAnalytics': {
            return [
                query('year')
                    .exists()
                    .withMessage({ error: "Please enter year", error_Code: errorCode.Year_not_entered })
                    // .matches("(?:(?:18|19|20|21)[0-9]{2}$)")
                    .matches(/^(?=.*?(19[0-9]|20\d{2}).*)\d{4}$/)
                    .withMessage({ error: "Invalid year", error_Code: errorCode.Invalid_Year }),

                query('month')
                    .optional()
                    .matches("^(0?[1-9]|1[012])$")
                    .withMessage({ error: "Invalid month", error_Code: errorCode.Invalid_month }),

                query('day')
                    .optional()
                    .matches("^(([0]?[1-9])|([1-2][0-9])|(3[01]))$")
                    .withMessage({ error: "Invalid day", error_Code: errorCode.Invalid_day })

            ]
        }
        case 'userCount':
            {
                return [
                    query('year')
                        .exists()
                        .withMessage({ error: "Please enter year", error_Code: errorCode.Year_not_entered })
                        .matches(/^(?=.*?(19[0-9]|20\d{2}).*)\d{4}$/)
                        .withMessage({ error: "Invalid year" }),



                ]
            }


        case 'updateOrderStatus': {
            return [
                query("productId")
                    .exists()
                    .withMessage({ error: "No product Id given.", error_Code: errorCode.No_product_id_entered })
                    .bail()
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product Id given.", error_Code: errorCode.No_product_id_entered })
                    .bail()
                    .isNumeric()
                    .withMessage({ error: "Product Id should be a number.", error_Code: errorCode.Invalid_productId })
                    .bail()
                    .custom((value) => {
                        return Product.find({ _id: Long.fromString(value.toString()), deleted: 0 }).count().then(count => {
                            if (count > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Product not found.", error_Code: errorCode.Product_not_found }),

                query('orderId')
                    .exists()
                    .withMessage({ error: "No order Id given.", error_Code: errorCode.No_order_id_entered })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No order Id given.", error_Code: errorCode.No_order_id_entered })
                    .isNumeric()
                    .withMessage({ error: "Invalid order Id type.", error_Code: errorCode.Invalid_OrderId })
                    .bail()
                    .custom((value, { req }) => {
                        return Order.find({ _id: Long.fromString(value.toString()), products: { $elemMatch: { _id: Long.fromString(req.query.productId.toString()) } } }).count().then(count => {
                            if (count > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Order Id / Order with specified product not found", error_Code: errorCode.No_order_found })
                    .bail(),

                query('status')
                    .exists()
                    .withMessage({ error: "No Order Status Entered", error_Code: errorCode.No_order_status_entered })
                    .bail()
                    .isIn(Object.values(orderStatusUtils))
                    .withMessage({ error: "Invalid Order Status", error_Code: errorCode.Invalid_orderStatus })
                    .bail()
                    .custom((value, { req }) => {
                        return Order.aggregate([
                            { $match: { _id: Long.fromString(req.query.orderId.toString()) } },
                            { $unwind: '$products' },
                            { $match: { 'products._id': Long.fromString(req.query.productId.toString()) } },
                        ]).then(order => {
                            if (order[0].products.orderStatus === orderStatusUtils.waitingForPaymentConfirmation && (order[0].paymentStatus === paymentStatusUtils.paymentInitiated || order[0].paymentStatus === paymentStatusUtils.waitingForPayment))
                                return Promise.reject()
                            else
                                return Promise.resolve()
                        })
                    })
                    .withMessage({ error: "Status cannot be changed for product in waiting for payment status.", error_Code: errorCode.Access_restricted })
                    .bail()
            ]
        }
        case 'viewUserResponse': {
            return [
                param("id")
                    .optional()
                    .isInt()
                    .withMessage({ error: "Please enter valid orderId", error_Code: errorCode.Invalid_OrderId }),
                query('page')
                    .optional()
                    .isInt({ min: 1 })
                    .withMessage({ error: 'Invalid Page Number. Should be a positive integer starting from one.', error_Code: errorCode.Invalid_page_Number }),
                query('size')
                    .optional()
                    .isInt({ min: 1 })
                    .withMessage({ error: 'Invalid Page Size. Should be a positive integer starting from one.', error_Code: errorCode.Invalid_page_size }),
                query('updatedate')
                    .optional()
                    .isIn([1, -1])
                    .withMessage({ error: 'Invalid UpdateDate parameter. Should be -1 or 1', error_Code: errorCode.Invalid_updateDate_parameter }),
                query('replyStatus')
                    .optional()
                    .isIn([0, 1])
                    .withMessage({ error: 'Invalid replyStatus parameter. Should be 0 or 1', error_Code: errorCode.Invalid_replyStatus }),
            ]
        }

        case 'addReply': {
            return [
                param('id')
                    .exists()
                    .withMessage({ error: "No Id provided.", error_Code: errorCode.No_order_id_entered })
                    .isNumeric()
                    .withMessage({ error: "Invalid id entered", error_Code: errorCode.Invalid_chatId })
                    .custom((value) => {
                        return ChatBot.find({ _id: Long.fromString(value.toString()), }).count().then(count => {
                            if (count !== 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "No responses found with the given Id.", error_Code: errorCode.No_order_found })
                    .bail(),

                body('adminResponse')
                    .exists()
                    .withMessage({ error: 'Response is required!', error_Code: errorCode.Response_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Response cannot be empty!', error_Code: errorCode.Response_cannot_Empty })
                    .isString()
                    .withMessage({ error: 'Invalid response', error_Code: errorCode.Invalid_Response })
                    .isLength({ min: 3 })
                    .withMessage({ error: 'Response field must contain at least 3 characters', error_Code: errorCode.Min_length_response })
                    .isLength({ max: 200 })
                    .withMessage({ error: 'Response field  must not exceed 200 characters', error_Code: errorCode.Max_length_response }),


            ]
        }

        case 'viewresponseDetail': {
            return [
                param('id')
                    .exists()
                    .withMessage({ error: "No Id provided.", error_Code: errorCode.No_order_id_entered })
                    .isNumeric()
                    .withMessage({ error: "Invalid id entered", error_Code: errorCode.Invalid_chatId })
                    .custom((value) => {
                        return ChatBot.find({ _id: Long.fromString(value.toString()), }).count().then(count => {
                            if (count !== 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "No responses found with the given Id.", error_Code: errorCode.No_order_found })
                    .bail(),

            ]
        }
        case 'addImage': {

            return [
                body('homeImages')
                    .exists()
                    .withMessage({ error: "Images required", error_Code: errorCode.HomeImage_Required })
                    .isArray()
                    .withMessage({ error: "Invalid images type.", error_Code: errorCode.Invalid_Image_Type })
                    .custom(value => {
                        return (value.length == 4)
                    })
                    .withMessage({ error: "Should  contain 4 images .", error_Code: errorCode.Should_not_contain_more_than_4_images })
                    .bail()
                    .custom(value => {
                        return new Set(value).size === value.length
                    })
                    .withMessage({ error: "Images should not contain duplicate image names.", error_Code: errorCode.Duplicate_images_not_allowed }),

                body('imageType')
                    .exists()
                    .withMessage({ error: 'Image type is required!', error_Code: errorCode.Image_type_Required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Image type cannot be empty!', error_Code: errorCode.Image_type_cannotbe_empty })
                    .isString()
                    .withMessage({ error: 'Invalid image type', error_Code: errorCode.Invalid_ImageType })
                    .isLength({ min: 3 })
                    .withMessage({ error: 'Image type  must contain at least 3 characters', error_Code: errorCode.Min_length_Image })
                    .isLength({ max: 30 })
                    .withMessage({ error: 'Image type must not exceed 30 characters', error_Code: errorCode.Max_length_Image }),
            ]
        }

        case 'editImage': {

            return [
                param('id')
                    .exists()
                    .withMessage({ error: "No image Id provided.", error_Code: errorCode.No_imageId_entered })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Image Id cannot be empty!', error_Code: errorCode.ImageId_cannotbe_empty })
                    .isNumeric()
                    .withMessage({ error: "Invalid image id type entered.", error_Code: errorCode.Invalid_ImageType })
                    .custom((value) => {
                        return HomeImage.find({ _id: Long.fromString(value.toString()), }).count().then(count => {
                            if (count !== 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "No  image found with the given Id.", error_Code: errorCode.No_imageId_Found })
                    .bail(),

                body('homeImages')
                    .exists()
                    .withMessage({ error: "Images required", error_Code: errorCode.HomeImage_Required })
                    .isArray()
                    .withMessage({ error: "Invalid images type.", error_Code: errorCode.Invalid_Image_Type })
                    .custom(value => {
                        return (value.length == 4)
                    })
                    .withMessage({ error: "Should  contain 4 images .", error_Code: errorCode.Should_not_contain_more_than_4_images })
                    .bail()
                    .custom(value => {
                        return new Set(value).size === value.length
                    })
                    .withMessage({ error: "Images should not contain duplicate image names.", error_Code: errorCode.Duplicate_images_not_allowed }),

                body('imageType')
                    .exists()
                    .withMessage({ error: 'Image type is required!', error_Code: errorCode.Image_type_Required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Image type cannot be empty!', error_Code: errorCode.Image_type_cannotbe_empty })
                    .isString()
                    .withMessage({ error: 'Invalid image type', error_Code: errorCode.Invalid_ImageType })
                    .isLength({ min: 3 })
                    .withMessage({ error: 'Image type  must contain at least 3 characters', error_Code: errorCode.Min_length_Image })
                    .isLength({ max: 30 })
                    .withMessage({ error: 'Image type must not exceed 30 characters', error_Code: errorCode.Max_length_Image }),
            ]
        }


    }
}

module.exports = { adminValidator };