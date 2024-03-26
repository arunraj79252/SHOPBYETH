const { body, query, param } = require('express-validator')
const db = require('../models')
const errorCode = require('../utils/error-code.utils')
const Product = db.product;
const Long = require('mongodb').Long;
const publicValidator = (validationtype) => {
    switch (validationtype) {
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
                    .isInt({ min: 0, max: 5 })
                    .withMessage({ error: 'Invalid Gender parameter. Should be positive integer starting from zero.', error_Code: errorCode.Invalid_gender_parameter }),
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
            ]
        }

        case 'productId': {
            return [
                param("id")
                    .isNumeric()
                    .withMessage({ error: "Product Id should be a number.", error_Code: errorCode.Invalid_productId })
                    .bail()
                    .custom((value) => {
                        return products.find({ _id: Long.fromString(value.toString()) }).count().then(count => {
                            if (count > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage("Product not found.")
            ]
        }


        case 'list-category-subcategory-brand': {
            return [
                query('page')
                    .optional()
                    .isInt({ min: 1 })
                    .withMessage({ error: 'Invalid Page Number. Should be a positive integer starting from one.', error_Code: errorCode.Invalid_page_Number }),
                query('size')
                    .optional()
                    .isInt({ min: 1 })
                    .withMessage({ error: 'Invalid Page Size. Should be a positive integer starting from one.', error_Code: errorCode.Invalid_page_size }),
                query('createdAt')
                    .optional()
                    .isIn([1, -1])
                    .withMessage({ error: 'Invalid Sort parameter. Should be -1 or 1', error_Code: errorCode.Invalid_updateDate_parameter }),
                query('key')
                    .optional()
                    .isIn([0, 1])
                    .withMessage({ error: 'Invalid Key parameter. Should be 0 or 1', error_Code: errorCode.Invalid_key_parameter })
            ]
        }

        case 'getFeedbacks': {
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
                    .withMessage({ error: "Product not found.", error_Code: errorCode.Product_not_found }),
                query('page')
                    .optional()
                    .isInt({ min: 1 })
                    .withMessage({ error: 'Invalid Page Number. Should be a positive integer starting from one.', error_Code: errorCode.Invalid_page_Number }),
                query('size')
                    .optional()
                    .isInt({ min: 1 })
                    .withMessage({ error: 'Invalid Page Size. Should be a positive integer starting from one.', error_Code: errorCode.Invalid_page_size }),
                query('date')
                    .optional()
                    .isIn([1, -1])
                    .withMessage({ error: 'Invalid Date parameter. Should be -1 or 1', error_Code: errorCode.Invalid_updateDate_parameter }),
                query('rating')
                    .optional()
                    .isIn([1, -1])
                    .withMessage({ error: 'Invalid Rating parameter. Should be -1 or 1', error_Code: errorCode.Invalid_rating_parameter }),

            ]
        }
        case 'viewImageDetail': {
            return [
                param('id')
                    .exists()
                    .withMessage({ error: "No Id provided.", error_Code: errorCode.No_imageId_Found })
                    .isNumeric()
                    .withMessage({ error: "Invalid id entered", error_Code: errorCode.Invalid_imageType })
                    .custom((value) => {
                        return HomeImage.find({ _id: Long.fromString(value.toString()), }).count().then(count => {
                            if (count !== 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "No images found with the given Id.", error_Code: errorCode.No_imageId_Found })
                    .bail(),
            ]
        }
    }
}

module.exports = { publicValidator }