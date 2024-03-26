const { body, query, param } = require('express-validator');
const db = require('../models')
const errorCode = require('../utils/error-code.utils')
const Product = db.product;
const Wishlist = db.wishlist;
const Category = db.category;
const SubCategory = db.subCategory;
const Brand = db.brand;
const Long = require('mongodb').Long

const productValidator = (validationtype) => {
    switch (validationtype) {
        case 'productId': {
            return [
                param("id")
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
                    .withMessage({ error: "Product not found.", error_Code: errorCode.Product_not_found })
            ]
        }
        case 'productIdAdmin': {
            return [
                param("id")
                    .isNumeric()
                    .withMessage({ error: "Product Id should be a number.", error_Code: errorCode.Invalid_productId })
                    .bail()
                    .custom((value) => {
                        return Product.find({ _id: Long.fromString(value.toString()) }).count().then(count => {
                            if (count > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Product not found.", error_Code: errorCode.Product_not_found })
            ]
        }
        case 'wishlist': {
            return [
                param("id")
                    .isInt({ min: 0 })
                    .withMessage({ error: "Product id should be a positive integer.", error_Code: errorCode.Invalid_productId })
                    .bail()
                    .custom((value, { req }) => {
                        return Wishlist.find({ _id: req.user.id, products: { $elemMatch: { productId: Long.fromString(value.toString()) } } }).count().then(count => {
                            if (count > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Product not found.", error_Code: errorCode.Product_not_found })
            ]
        }

        case 'getProducts': {
            return [
                query('page')
                    .optional()
                    .isInt({ min: 1 })
                    .withMessage({ error: 'Invalid Page Number. Should be a positive integer starting from one.', error_Code: errorCode.Invalid_page_Number }),
                query('size')
                    .optional()
                    .isInt({ min: 1 })
                    .withMessage({ error: 'Invalid Page Size. Should be a positive integer starting from one.', error_Code: errorCode.Invalid_page_size }),
                query('gender')
                    .optional()
                    .custom(value => {
                        value = value.replaceAll(' ', '');
                        const regex = new RegExp("^(([-0-9a-zA-z](,)?)*)+$")
                        if (regex.test(value))
                            return Promise.resolve()
                        else
                            return Promise.reject()
                    })
                    .withMessage({ error: 'Invalid Gender parameter delimiter. Use only commas (,) as delimiter', error_Code: errorCode.Invalid_parameter_delimiter })
                    .custom((value, { req }) => {
                        let genders = value.split(',')
                        let flag = 0
                        genders.forEach(element => {
                            if (isNaN(element)) {
                                flag++;
                            }
                            if (element < 0 || element > 5) {
                                flag++;
                            }
                        })
                        if (flag != 0)
                            return Promise.reject()
                        else
                            return Promise.resolve()
                    })
                    .withMessage({ error: "Invalid Gender parameters. Only positive integers from zero to five are allowed", error_Code: errorCode.Invalid_gender_parameter }),
                query('views')
                    .optional()
                    .isIn([1, -1])
                    .withMessage({ error: 'Invalid Views parameter. Should be -1 or 1', error_Code: errorCode.Invalid_views_parameter }),
                query('sales')
                    .optional()
                    .isIn([1, -1])
                    .withMessage({ error: 'Invalid sales parameter. Should be -1 or 1', error_Code: errorCode.Invalid_sales_parameter }),
                query('price')
                    .optional()
                    .isIn([1, -1])
                    .withMessage({ error: 'Invalid price parameter. Should be -1 or 1', error_Code: errorCode.Invalid_price_paramter }),
                query('avgRating')
                    .optional()
                    .isIn([1, -1])
                    .withMessage({ error: 'Invalid avgRating parameter. Should be -1 or 1', error_Code: errorCode.Invalid_rating_parameter }),
                query('rating')
                    .optional()
                    .isFloat({ min: 1, max: 5 })
                    .withMessage({ error: 'Invalid rating parameter. Should be a float between 1 - 5.', error_Code: errorCode.Invalid_rating_parameter }),
                query('deleted')
                    .optional()
                    .isIn([0, 1])
                    .withMessage({ error: 'Invalid deleted parameter. Should be 0 or 1', error_Code: errorCode.Invalid_deleted_parameter }),
                query('outOfStock')
                    .optional()
                    .isIn([0, 1])
                    .withMessage({ error: 'Invalid outOfStock parameter. Should be 0 or 1', error_Code: errorCode.Invalid_deleted_parameter }),
                query('createdAt')
                    .optional()
                    .isIn([-1, 1])
                    .withMessage({ error: 'Invalid createdAt parameter. Should be -1 or 1', error_Code: errorCode.Invalid_outOfStock_parameter }),
                query('category')
                    .optional()
                    .custom(value => {
                        return Category.find({ _id: value }).count().then(categoryCount => {
                            if (categoryCount > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Category not found!", error_Code: errorCode.Category_not_found }),
                query('subCategory')
                    .optional()
                    .custom(value => {
                        value = value.replaceAll(' ', '');
                        const regex = new RegExp("^(([a-zA-z0-9](,)?)*)+$")
                        if (regex.test(value))
                            return Promise.resolve()
                        else
                            return Promise.reject()
                    })
                    .withMessage({ error: 'Invalid subCategory parameter delimiter. Use only commas (,) as delimiter', error_Code: errorCode.Invalid_parameter_delimiter })
                    .custom((value, { req }) => {
                        value = value.replaceAll(' ', '');
                        let subCategories = value.split(',')
                        return SubCategory.find({ _id: { $in: subCategories }, categoryId: req.query.category }).then(subCategory => {
                            let index = 0
                            let flag = 0
                            while (index !== subCategory.length) {
                                for (let i = 0; i < subCategories.length; i++) {
                                    if (subCategory[index]._id === subCategories[i]) {
                                        flag++
                                    }
                                }
                                index++
                            }
                            if ((flag === subCategories.length)) {
                                return Promise.resolve()
                            }
                            else {
                                return Promise.reject()
                            }
                        })
                    })
                    .withMessage({ error: "One or more Subcategories specified is not valid. Please make sure all subcategories are valid", error_Code: errorCode.Subcategory_not_found }),
                query('typeId')
                    .optional()
                    .custom((value, { req }) => {
                        let subCategory = req.query.subCategory.replaceAll(' ', '');
                        let subCategories = subCategory.split(',')
                        if (subCategories.length === 1)
                            return Promise.resolve()
                        else
                            return Promise.reject()
                    })
                    .withMessage({ error: "Type parameter not allowed for Multiple SubCategories", error_Code: errorCode.Type_not_found })
                    .custom(value => {
                        value = value.replaceAll(' ', '');
                        const regex = new RegExp("^(([a-zA-z0-9](,)?)*)+$")
                        if (regex.test(value))
                            return Promise.resolve()
                        else
                            return Promise.reject()
                    })
                    .withMessage({ error: 'Invalid Type parameter delimiter. Use only commas (,) as delimiter', error_Code: errorCode.Invalid_parameter_delimiter })
                    .custom((value, { req }) => {
                        let subCategory = req.query.subCategory.replaceAll(' ', '');
                        return SubCategory.findOne({ _id: subCategory }).then(subCategory => {
                            value = value.replaceAll(' ', '');
                            let types = value.split(',')
                            let index = 0
                            let flag = 0
                            while (index !== subCategory.type.length) {
                                for (let i = 0; i < types.length; i++) {
                                    if (subCategory.type[index].id === types[i]) {
                                        flag++
                                    }
                                }
                                index++
                            }
                            if ((flag === types.length)) {
                                return Promise.resolve()
                            }
                            else {
                                return Promise.reject()
                            }

                        })
                    })
                    .withMessage({ error: "One or more Types specified is not valid. Please make sure all types are valid !", error_Code: errorCode.Type_not_found }),
                query('brand')
                    .optional()
                    .custom(value => {
                        value = value.replaceAll(' ', '');
                        const regex = new RegExp("^(([a-zA-z0-9](,)?)*)+$")
                        if (regex.test(value))
                            return Promise.resolve()
                        else
                            return Promise.reject()
                    })
                    .withMessage({ error: 'Invalid Brand parameter delimiter. Use only commas (,) as delimiter', error_Code: errorCode.Invalid_parameter_delimiter })
                    .custom(value => {
                        value = value.replaceAll(' ', '');
                        let brands = value.split(',')
                        return Brand.find({ _id: { $in: brands } }).then(Brand => {
                            let index = 0
                            let flag = 0
                            while (index !== Brand.length) {
                                for (let i = 0; i < brands.length; i++) {
                                    if (Brand[index]._id === brands[i]) {
                                        flag++
                                    }
                                }
                                index++
                            }
                            if ((flag === brands.length)) {
                                return Promise.resolve()
                            }
                            else {
                                return Promise.reject()
                            }
                        })
                    })
                    .withMessage({ error: "One or more Brands specified is not valid. Please make sure all brands are valid!", error_Code: errorCode.Brand_not_found }),
            ]
        }

        case 'deleteProduct': {
            return [
                query("id")
                    .exists()
                    .withMessage({ error: "id parameter not provided.", error_Code: errorCode.Product_Id_not_provided })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "id parameter not provided.", error_Code: errorCode.Product_Id_not_provided })
                    .bail()
                    .isNumeric()
                    .withMessage({ error: "Product Id should be a number.", error_Code: errorCode.Invalid_productId })
                    .bail()
                    .custom((value) => {
                        return Product.find({ _id: Long.fromString(value.toString()) }).count().then(count => {
                            if (count > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Product not found.", error_Code: errorCode.Product_not_found }),

                query("deleted")
                    .exists()
                    .withMessage({ error: "deleted parameter not provided.", error_Code: errorCode.Deleted_parameter_not_provided })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "deleted parameter not provided.", error_Code: errorCode.Deleted_parameter_not_provided })
                    .bail()
                    .isIn([0, 1])
                    .withMessage({ error: "Deleted query parameter must be 0 or 1.", error_Code: errorCode.Invalid_deleted_parameter })
                    .bail()
            ]
        }

        case 'productInfo': {
            return [
                body('productIds.*')
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
                    .withMessage({ error: "One or more product is not available.", error_Code: errorCode.Product_not_found })
            ]
        }
    }
}

module.exports = { productValidator };