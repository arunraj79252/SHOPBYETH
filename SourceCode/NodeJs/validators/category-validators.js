const { body } = require('express-validator');
const errorCode = require('../utils/error-code.utils')

exports.categoryValidator = [
    body('name')
        .exists()
        .withMessage({ error: 'Category name  required!', error_Code: errorCode.Category_name_required })
        .notEmpty({ ignore_whitespace: true })
        .withMessage({ error: 'Category name  cannot be empty', error_Code: errorCode.Category_cannot_empty })
        .isString()
        .withMessage({ error: 'Invalid Category name! ', error_Code: errorCode.Invalid_category })
        .isLength({ min: 2 })
        .withMessage({ error: " Category name is too short.", error_Code: errorCode.Category_too_short })
        .isLength({ max: 30 })
        .withMessage({ error: "Category name is too long.", error_Code: errorCode.Category_too_long }),
]

exports.subCategoryValidator = [
    body('categoryId')
        .exists()
        .withMessage({ error: 'Category id required!', error_Code: errorCode.Category_id_required })
        .notEmpty({ ignore_whitespace: true })
        .withMessage({ error: 'Category id required!', error_Code: errorCode.Category_id_required }),
    body('name')
        .exists()
        .withMessage({ error: 'Subcategory name  required!', error_Code: errorCode.Subcategory_name_required })
        .notEmpty({ ignore_whitespace: true })
        .withMessage({ error: 'Subcategory name  cannot be empty!', error_Code: errorCode.Subcategory_cannot_empty })
        .isString()
        .withMessage({ error: 'Invalid Subcategory name! ', error_Code: errorCode.Invalid_subcategory })
        .isLength({ min: 2 })
        .withMessage({ error: " Subcategory name is too short.", error_Code: errorCode.Subcategory_too_short })
        .isLength({ max: 30 })
        .withMessage({ error: "Subcategory name is too long.", error_Code: errorCode.Subcategory_too_long }),
]