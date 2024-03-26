const { body, query, param } = require('express-validator')
const db = require('../models')
const User = db.user;
const Product = db.product;
const Order = db.orders
const ChatBot = db.chatBot;
const HomeImage = db.homeImage

const { Invalid_price_paramter, No_product_id_entered, No_productIdEntered } = require('../utils/error-code.utils')
const errorCode = require('../utils/error-code.utils');
const orderStatusUtils = require('../utils/order-status.utils');
const Long = require('mongodb').Long
const userValidator = (validationtype) => {
    switch (validationtype) {
        case 'registration': {
            return [
                body('publicAddress', 'Invalid Public Address')
                    .exists()
                    .withMessage({ error: 'Public address required', error_Code: errorCode.Public_address_is_required })
                    .bail()
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Public address required', error_Code: errorCode.Public_address_is_required })
                    .bail()
                    .isEthereumAddress()
                    .withMessage({ error: 'Invalid Public Address', error_Code: errorCode.Invalid_public_address })
                    .custom((value) => {
                        return User.find({ _id: value.toLowerCase() }).count().then(count => {
                            if (count > 0)
                                return Promise.reject()
                            else
                                return Promise.resolve()
                        })
                    })
                    .withMessage({ error: "Public Address already registered.", error_Code: errorCode.User_already_exists }),

                body('name')
                    .exists()
                    .withMessage({ error: 'Name required', error_Code: errorCode.Name_is_required })
                    .bail()
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Name required', error_Code: errorCode.Name_is_required })
                    .bail()
                    .isString()
                    .isAlpha('en-US', { ignore: [' ', '.'] })
                    .withMessage({ error: 'Name should contain only alphabets.', error_Code: errorCode.Invalid_name })
                    .bail()
                    .isLength({ min: 3 })
                    .withMessage({ error: 'Name must contain atleast 3 characters', error_Code: errorCode.Name_too_short })
                    .bail()
                    .isLength({ max: 100 })
                    .withMessage({ error: 'Name must not exceed 100 characters', error_Code: errorCode.Name_too_long })
                    .bail(),

                body('email')
                    .exists()
                    .withMessage({ error: "No Email provided.", error_Code: errorCode.Email_is_required })
                    .bail()
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No Email provided.", error_Code: errorCode.Email_is_required })
                    .bail()
                    // .isLength({ min: 5 })
                    // .withMessage({ error: "Email address too short.", error_Code: errorCode.Email_address_too_short })
                    // .bail()
                    // .isLength({ max: 320 })
                    // .withMessage({ error: "Email address too long.", error_Code: errorCode.Email_address_too_long })
                    // .bail()
                    .isEmail()
                    .withMessage({ error: 'Invalid Email Address', error_Code: errorCode.Invalid_email_address })
                    .bail()
                    .matches(/^[\w-_@\.]+$/)
                    .withMessage({ error: 'Invalid Email Address', error_Code: errorCode.Invalid_email_address })
                    .bail()
                    .custom((value) => {
                        return User.find({ email: value.toLowerCase() }).count().then(count => {
                            if (count > 0)
                                return Promise.reject()
                            else
                                return Promise.resolve()
                        })
                    })
                    .withMessage({ error: "Email Address already exists.", error_Code: errorCode.Email_already_exists }),

                body('phoneNo').optional({ nullable: true, checkFalsy: true })
                    .isLength({ min: 10, max: 10 })
                    .withMessage({ error: "Invalid phone number length", error_Code: errorCode.Invalid_phone_length })
                    .bail()
                    .matches("^[1-9]{1}[0-9]{9}$")
                    .withMessage({ error: 'Invalid Phone number', error_Code: errorCode.Invalid_phone_number })
                    .custom((value) => {
                        return User.find({ phoneNo: value }).count().then(count => {
                            if (count > 0)
                                return Promise.reject()
                            else
                                return Promise.resolve()
                        })
                    })
                    .withMessage({ error: "Phone number already exists.", error_Code: errorCode.Phone_number_already_exists }),
            ]
        }

        case 'addressValidate': {
            return [
                body('name')
                    .exists()
                    .withMessage({ error: 'Name required!', error_Code: errorCode.Name_is_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Name required!', error_Code: errorCode.Name_is_required })
                    .isString()
                    .withMessage({ error: 'Invalid name', error_Code: errorCode.Invalid_name })
                    .isAlpha('en-US', { ignore: [' ', '.'] })
                    .withMessage({ error: 'Invalid name', error_Code: errorCode.Invalid_name })
                    .matches("^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*$")
                    .withMessage({ error: 'Invalid name', error_Code: errorCode.Invalid_name })
                    .isLength({ min: 3 })
                    .withMessage({ error: 'Name must contain atleast 3 characters', error_Code: errorCode.Name_too_short })
                    .bail()
                    .isLength({ max: 100 })
                    .withMessage({ error: 'Name must not exceed 100 characters', error_Code: errorCode.Name_too_long })
                    .bail(),

                body('mobile')
                    .exists()
                    .withMessage({ error: 'Phone number required!', error_Code: errorCode.mobile_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Phone number required!', error_Code: errorCode.mobile_required })
                    .isLength({ min: 10, max: 10 })
                    .withMessage({ error: "Invalid Phone number length", error_Code: errorCode.Invalid_phone_length })
                    .bail()
                    .matches("^[1-9]{1}[0-9]{9}$")
                    .withMessage({ error: 'Invalid Phone number', error_Code: errorCode.Invalid_phone_number }),

                body('pincode')
                    .exists()
                    .withMessage({ error: 'Zip code required!', error_Code: errorCode.Pin_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Zip code required!', error_Code: errorCode.Pin_required })
                    .matches("^[1-9]{1}[0-9]{5}$")
                    .withMessage({ error: 'Invalid pin', error_Code: errorCode.Invalid_pincode }),

                body('state')
                    .exists()
                    .withMessage({ error: 'State name required!', error_Code: errorCode.State_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'State name required!', error_Code: errorCode.State_required })
                    .isString()
                    .withMessage({ error: 'Invalid state', error_Code: errorCode.Invalid_state })
                    .isAlpha('en-US', { ignore: [' ', '.'] })
                    .withMessage({ error: 'Invalid state', error_Code: errorCode.Invalid_state })
                    .isLength({ min: 3 })
                    .withMessage({ error: 'State name must contain at least 3 characters', error_Code: errorCode.Min_length_string })
                    .isLength({ max: 20 })
                    .withMessage({ error: 'State name must not exceed 20 characters', error_Code: errorCode.Max_length_string }),

                body('address')
                    .exists()
                    .withMessage({ error: 'Address line 1 cannot be empty!', error_Code: errorCode.Address_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Address line 1 cannot be empty!', error_Code: errorCode.Address_required })
                    .isString()
                    .withMessage({ error: 'Invalid address', error_Code: errorCode.Invalid_address })
                    .matches('^[a-zA-Z0-9 ,.]+$')
                    .withMessage({ error: 'Invalid address!', error_Code: errorCode.Invalid_address })
                    .isLength({ min: 3 })
                    .withMessage({ error: 'Address line  must contain at least 3 characters', error_Code: errorCode.Min_length_address })
                    .isLength({ max: 50 })
                    .withMessage({ error: 'Address line  must not exceed 50 characters', error_Code: errorCode.Max_length_address }),

                body('locality')
                    .exists()
                    .withMessage({ error: 'Locality required', error_Code: errorCode.Locality_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Locality required', error_Code: errorCode.Locality_required })
                    .isString()
                    .withMessage({ error: 'Invalid locality', error_Code: errorCode.Invalid_locality })
                    .matches('^[a-zA-Z0-9 ,.]+$')
                    .withMessage({ error: 'Invalid locality', error_Code: errorCode.Invalid_locality })
                    .isLength({ min: 3 })
                    .withMessage({ error: ' Locality must contain at least 3 characters', error_Code: errorCode.Min_length_string })
                    .isLength({ max: 50 })
                    .withMessage({ error: ' Locality must not exceed 50 characters', error_Code: errorCode.Max_length_string }),

                body('city')
                    .exists()
                    .withMessage({ error: 'City name required', error_Code: errorCode.City_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'City name required', error_Code: errorCode.City_required })
                    .isString()
                    .withMessage({ error: 'Invalid city name', error_Code: errorCode.Invalid_city })
                    .isAlpha('en-US', { ignore: [' ', '.'] })
                    .withMessage({ error: 'Invalid city name', error_Code: errorCode.Invalid_city })
                    .isLength({ min: 3 })
                    .withMessage({ error: 'City name must contain atleast 3 characters', error_Code: errorCode.Min_length_string })
                    .isLength({ max: 50 })
                    .withMessage({ error: 'City name must not exceed 50 characters', error_Code: errorCode.Max_length_string }),

                body('country')
                    .exists()
                    .withMessage({ error: 'Country name required', error_Code: errorCode.Country_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Country name required', error_Code: errorCode.Country_required })
                    .isString()
                    .withMessage({ error: 'Invalid country name', error_Code: errorCode.Invalid_country })
                    .isAlpha('en-US', { ignore: [' ', '.'] })
                    .withMessage({ error: 'Invalid country name', error_Code: errorCode.Invalid_country })
                    .isLength({ min: 2 })
                    .withMessage({ error: 'Country name must contain at least 2 characters', error_Code: errorCode.Min_length_string })
                    .isLength({ max: 50 })
                    .withMessage({ error: 'Country name muust not exceed 50 characters', error_Code: errorCode.Max_length_string }),

                body('label')
                    .exists()
                    .withMessage({ error: 'Label cannot be empty! ', error_Code: errorCode.Label_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Label cannot be empty! ', error_Code: errorCode.Label_required })
                    .isIn([0, 1, 2])
                    .withMessage({ error: 'Invalid Address type', error_Code: errorCode.Invalid_address_label })
            ]
        }

        case 'addressValidateUpdate': {
            return [
                body('name')
                    .exists()
                    .withMessage({ error: 'Name required!', error_Code: errorCode.Name_is_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Name required!', error_Code: errorCode.Name_is_required })
                    .isString()
                    .withMessage({ error: 'Invalid name', error_Code: errorCode.Invalid_name })
                    .isAlpha('en-US', { ignore: [' ', '.'] })
                    .withMessage({ error: 'Invalid name', error_Code: errorCode.Invalid_name })
                    .isLength({ min: 3 })
                    .withMessage({ error: 'Name must contain atleast 3 characters', error_Code: errorCode.Name_too_short })
                    .bail()
                    .isLength({ max: 100 })
                    .withMessage({ error: 'Name must not exceed 100 characters', error_Code: errorCode.Name_too_long })
                    .bail(),

                body('mobile')
                    .exists()
                    .withMessage({ error: 'Phone number required!', error_Code: errorCode.mobile_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Phone number required!', error_Code: errorCode.mobile_required })
                    .isLength({ min: 10, max: 10 })
                    .withMessage({ error: "Invalid Phone number length", error_Code: errorCode.Invalid_phone_length })
                    .bail()
                    .matches("^[1-9]{1}[0-9]{9}$")
                    .withMessage({ error: 'Invalid Phone number', error_Code: errorCode.Invalid_phone_number }),

                body('pincode')
                    .exists()
                    .withMessage({ error: 'Zip code required!', error_Code: errorCode.Pin_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Zip code required!', error_Code: errorCode.Pin_required })
                    .matches("^[1-9]{1}[0-9]{5}$")
                    .withMessage({ error: 'Invalid pin', error_Code: errorCode.Invalid_pincode }),

                body('state')
                    .exists()
                    .withMessage({ error: 'State name required!', error_Code: errorCode.State_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'State name required!', error_Code: errorCode.State_required })
                    .isString()
                    .withMessage({ error: 'Invalid state', error_Code: errorCode.Invalid_state })
                    .isAlpha('en-US', { ignore: [' ', '.'] })
                    .withMessage({ error: 'Invalid state', error_Code: errorCode.Invalid_state })
                    .isLength({ min: 3 })
                    .withMessage({ error: 'State name must contain at least 3 characters', error_Code: errorCode.Min_length_string })
                    .isLength({ max: 20 })
                    .withMessage({ error: 'State name must not exceed 20 characters', error_Code: errorCode.Max_length_string }),

                body('address')
                    .exists()
                    .withMessage({ error: 'Address line 1 cannot be empty!', error_Code: errorCode.Address_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Address line 1 cannot be empty!', error_Code: errorCode.Address_required })
                    .isString()
                    .withMessage({ error: 'Invalid address', error_Code: errorCode.Invalid_address })
                    .matches('^[a-zA-Z0-9 ,.]+$')
                    .withMessage({ error: 'Invalid address', error_Code: errorCode.Invalid_address })
                    .isLength({ min: 3 })
                    .withMessage({ error: 'Address line  must contain at least 3 characters', error_Code: errorCode.Min_length_address })
                    .isLength({ max: 50 })
                    .withMessage({ error: 'Address line  must not exceed 50 characters', error_Code: errorCode.Max_length_address }),

                body('locality')
                    .exists()
                    .withMessage({ error: 'Locality required', error_Code: errorCode.Locality_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Locality required', error_Code: errorCode.Locality_required })
                    .isString()
                    .withMessage({ error: 'Invalid locality', error_Code: errorCode.Invalid_locality })
                    .matches('^[a-zA-Z0-9 ,.]+$')
                    .withMessage({ error: 'Invalid locality', error_Code: errorCode.Invalid_locality })
                    .isLength({ min: 3 })
                    .withMessage({ error: ' Locality must contain at least 3 characters', error_Code: errorCode.Min_length_string })
                    .isLength({ max: 50 })
                    .withMessage({ error: ' Locality must not exceed 50 characters', error_Code: errorCode.Max_length_string }),

                body('city')
                    .exists()
                    .withMessage({ error: 'City name required', error_Code: errorCode.City_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'City name required', error_Code: errorCode.City_required })
                    .isString()
                    .withMessage({ error: 'Invalid city name', error_Code: errorCode.Invalid_city })
                    .isAlpha('en-US', { ignore: [' ', '.'] })
                    .withMessage({ error: 'Invalid city name', error_Code: errorCode.Invalid_city })
                    .isLength({ min: 3 })
                    .withMessage({ error: 'City name must contain atleast 3 characters', error_Code: errorCode.Min_length_string })
                    .isLength({ max: 50 })
                    .withMessage({ error: 'City name must not exceed 50 characters', error_Code: errorCode.Max_length_string }),

                body('country')
                    .exists()
                    .withMessage({ error: 'Country name required', error_Code: errorCode.Country_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Country name required', error_Code: errorCode.Country_required })
                    .isString()
                    .withMessage({ error: 'Invalid country name', error_Code: errorCode.Invalid_country })
                    .isAlpha('en-US', { ignore: [' ', '.'] })
                    .withMessage({ error: 'Invalid country name', error_Code: errorCode.Invalid_country })
                    .isLength({ min: 2 })
                    .withMessage({ error: 'Country name must contain at least 2 characters', error_Code: errorCode.Min_length_string })
                    .isLength({ max: 50 })
                    .withMessage({ error: 'Country name muust not exceed 50 characters', error_Code: errorCode.Max_length_string }),

                body('label')
                    .exists()
                    .withMessage({ error: 'Label required! ', error_Code: errorCode.Label_required })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Label cannot be empty! ', error_Code: errorCode.Label_required })
                    .isIn([0, 1, 2])
                    .withMessage({ error: 'Invalid Address type', error_Code: errorCode.Invalid_address_label }),
                body('primary')
                    .exists()
                    .withMessage({ error: 'Primary required! ', error_Code: errorCode.Primary_requied })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Primary field cannot be empty! ', error_Code: errorCode.Primary_cannot_empty })
                    .isIn([0, 1])
                    .withMessage({ error: 'Primary field can accept only 0 or 1 ', error_Code: errorCode.Invalid_data_primary })
            ]
        }

        case 'updateUser': {
            return [
                body('name')
                    .exists()
                    .withMessage({ error: 'Name required', error_Code: errorCode.Name_is_required })
                    .bail()
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Name required', error_Code: errorCode.Name_is_required })
                    .bail()
                    .isString()
                    .isAlpha('en-US', { ignore: [' ', '.'] })
                    .withMessage({ error: 'Name should contain only alphabets.', error_Code: errorCode.Invalid_name })
                    .bail()
                    .isLength({ min: 3 })
                    .withMessage({ error: 'Name must contain atleast 3 characters', error_Code: errorCode.Name_too_short })
                    .bail()
                    .isLength({ max: 100 })
                    .withMessage({ error: 'Name must not exceed 100 characters', error_Code: errorCode.Name_too_long })
                    .bail(),

                body('email')
                    .exists()
                    .withMessage({ error: "No Email provided.", error_Code: errorCode.Email_is_required })
                    .bail()
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No Email provided.", error_Code: errorCode.Email_is_required })
                    .bail()
                    // .isLength({ min: 5 })
                    // .withMessage({ error: "Email address too short.", error_Code: errorCode.Email_address_too_short })
                    // .bail()
                    // .isLength({ max: 320 })
                    // .withMessage({ error: "Email address too long.", error_Code: errorCode.Email_address_too_long })
                    // .bail()
                    .isEmail()
                    .withMessage({ error: 'Invalid Email Address', error_Code: errorCode.Invalid_email_address })
                    .bail()
                    .custom((value, { req }) => {
                        return User.find({ email: value.toLowerCase() }).then(users => {
                            if (users.length != 0) {
                                if (users.length > 1)
                                    return Promise.reject()
                                else {
                                    if (users[0]._id === req.user.id) {
                                        return Promise.resolve()
                                    }
                                    else
                                        return Promise.reject()
                                }
                            }
                        })
                    })
                    .withMessage({ error: "Email Address already exists.", error_Code: errorCode.Email_already_exists }),

                body('phoneNo').optional({ nullable: true, checkFalsy: true })
                    .isLength({ min: 10, max: 10 })
                    .withMessage({ error: "Invalid phone number length", error_Code: errorCode.Invalid_phone_length })
                    .bail()
                    .matches("^[1-9]{1}[0-9]{9}$")
                    .withMessage({ error: 'Invalid Phone number', error_Code: errorCode.Invalid_phone_number })
                    .custom((value, { req }) => {
                        return User.find({ phoneNo: value }).then(users => {
                            if (users.length != 0) {
                                if (users.length > 1)
                                    return Promise.reject()
                                else {
                                    if (users[0]._id === req.user.id) {
                                        return Promise.resolve()
                                    }
                                    else
                                        return Promise.reject()
                                }
                            }
                        })
                    })
                    .withMessage({ error: "Phone number already exists.", error_Code: errorCode.Phone_number_already_exists }),
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
                query('orderstatus')
                    .optional()
                    .notEmpty()
                    .withMessage({ error: 'Invalid OrderStatus Array parameter or delimiter. Should be positive Integers. Use only commas (,) as delimiter', error_Code: errorCode.Invalid_orderstatus_parameter })
                    .matches(/^(([0-9](,)?)*)+$/)
                    .withMessage({ error: 'Invalid OrderStatus Array parameter or delimiter. Should be positive Integers. Use only commas (,) as delimiter', error_Code: errorCode.Invalid_orderstatus_parameter }),
            ]
        }

        case 'addFeedback': {
            return [
                body('productId')
                    .exists()
                    .withMessage({ error: "No product Id entered.", error_Code: errorCode.No_product_id_entered })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Product Id  required', error_Code: errorCode.ProductId_Required })
                    .isNumeric()
                    .withMessage({ error: "Please enter valid productId", error_Code: errorCode.Invalid_productId })
                    .custom((value) => {
                        return Product.find({ _id: Long.fromString(value.toString()), deleted: 0 }).count().then(count => {
                            if (count > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Product not found.", error_Code: errorCode.Product_not_found })
                    .bail(),

                body('rating')
                    .exists()
                    .withMessage({ error: 'Rating does not exist.', error_Code: errorCode.No_rating_specified })
                    .isInt({ min: 1, max: 5 })
                    .withMessage({ error: 'Invalid Rating value. Should be a positive integer between 1-5', error_Code: errorCode.Invalid_rating_type }),
                body('reviewTitle')
                    .exists()
                    .withMessage({ error: 'Review title does not exist.', error_Code: errorCode.No_review_title_given })
                    .isString()
                    .withMessage({ error: "Review title should be a string!", error_Code: errorCode.Review_title_should_be_string })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "Review title too short", error_Code: errorCode.Review_title_too_short })
                    .isLength({ max: 50 })
                    .withMessage({ error: "Review title too long", error_Code: errorCode.Review_title_too_long }),

                body('review').optional()
                    .isLength({ max: 1000 })
                    .withMessage({ error: "Review content too long", error_Code: errorCode.Review_content_too_long }),

                body('feedbackImages')
                    .optional()
                    .isArray()
                    .withMessage({ error: "Invalid feedback images type.", error_Code: errorCode.Invalid_product_image_type })
                    .custom(value => {
                        return (value.length <= 3)
                    })
                    .withMessage({ error: "Should not contain more than 3 images in feedback images.", error_Code: errorCode.Should_not_contain_more_than_10_images })
                    .bail()
                    .custom(value => {
                        return new Set(value).size === value.length
                    })
                    .withMessage({ error: "Feedback images should not contain duplicate image names.", error_Code: errorCode.Duplicate_images_not_allowed }),
            ]
        }
        case 'editFeedback': {
            return [
                param("feedbackId")
                    .isString()
                    .withMessage({ error: "Feedback Id should be a string.", error_Code: errorCode.Invalid_feedback_id })
                    .bail()
                    .custom((value) => {
                        return Product.find({ 'feedback._id': value }).count().then(count => {
                            if (count > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Feedback Id not found.", error_Code: errorCode.Feedback_not_found }),

                body('rating')
                    .exists()
                    .withMessage({ error: 'Rating does not exist.', error_Code: errorCode.No_rating_specified })
                    .isInt({ min: 1, max: 5 })
                    .withMessage({ error: 'Invalid Rating value. Should be a positive integer between 1-5', error_Code: errorCode.Invalid_rating_type }),

                body('reviewTitle')
                    .exists()
                    .withMessage({ error: 'Review title does not exist.', error_Code: errorCode.No_review_title_given })
                    .isString()
                    .withMessage({ error: "Review title should be a string!", error_Code: errorCode.Review_title_should_be_string })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "Review title too short", error_Code: errorCode.Review_title_too_short })
                    .isLength({ max: 50 })
                    .withMessage({ error: "Review title too long", error_Code: errorCode.Review_title_too_long }),

                body('review').optional()
                    .isString()
                    .withMessage({ error: "Review content should be a string!", error_Code: errorCode.Review_should_be_string })
                    .isLength({ max: 1000 })
                    .withMessage({ error: "Review content too long", error_Code: errorCode.Review_content_too_long }),

                body('feedbackImages')
                    .optional()
                    .isArray()
                    .withMessage({ error: "Invalid feedback images type.", error_Code: errorCode.Invalid_product_image_type })
                    .custom(value => {
                        return (value.length <= 3)
                    })
                    .withMessage({ error: "Should not contain more than 3 images in feedback images.", error_Code: errorCode.Should_not_contain_more_than_10_images })
                    .bail()
                    .custom(value => {
                        return new Set(value).size === value.length
                    })
                    .withMessage({ error: "Feedback images should not contain duplicate image names.", error_Code: errorCode.Duplicate_images_not_allowed }),
            ]
        }

        case 'addToCart': {
            return [

                body('products.*.productId')
                    .exists()
                    .withMessage({ error: "No product id entered", error_Code: errorCode.No_product_id_entered })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Product Id  required', error_Code: errorCode.ProductId_Required })
                    .isInt()
                    .withMessage({ error: "Please enter valid productId", error_Code: errorCode.Invalid_productId }),

                body('products.*.productQuantity')
                    .exists()
                    .withMessage({ error: "No product quantity entered", error_Code: errorCode.No_quantityEntered })
                    .isInt({ gt: 0 })
                    .withMessage({ error: "Please enter valid productQuantity", error_Code: errorCode.Invalid_quantity })
                    .custom(value => (typeof value === 'number'))
                    .withMessage({ error: "Please enter valid productQuantity", error_Code: errorCode.Invalid_quantity }),
            ]
        }

        case 'cancelOrder': {
            return [
                param("id")
                    .isInt()
                    .withMessage({ error: "Please enter valid orderId", error_Code: errorCode.Invalid_OrderId }),
                query('productId')
                    .exists()
                    .withMessage({ error: "No product Id entered.", error_Code: errorCode.No_product_id_entered })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Product Id  required', error_Code: errorCode.ProductId_Required })
                    .isNumeric()
                    .withMessage({ error: "Please enter valid productId", error_Code: errorCode.Invalid_productId })
                    .custom((value) => {
                        return Product.find({ _id: Long.fromString(value.toString()) }).count().then(count => {
                            if (count > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Product not found.", error_Code: errorCode.Product_not_found })
                    .bail(),

            ]
        }
        case 'returnOrder': {
            return [
                param("orderId")
                    .isInt()
                    .withMessage({ error: "Please enter valid orderId", error_Code: errorCode.Invalid_OrderId }),
                query('productId')
                    .exists()
                    .withMessage({ error: "No product Id entered.", error_Code: errorCode.No_product_id_entered })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Product Id  required', error_Code: errorCode.ProductId_Required })
                    .isNumeric()
                    .withMessage({ error: "Please enter valid productId", error_Code: errorCode.Invalid_productId })
                    .custom((value) => {
                        return Product.find({ _id: Long.fromString(value.toString()) }).count().then(count => {
                            if (count > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Product not found.", error_Code: errorCode.Product_not_found })
                    .bail(),
            ]
        }

        case 'deleteCart': {
            return [

                param("productId")
                    .isInt()
                    .withMessage({ error: "Please enter valid productId", error_Code: errorCode.Invalid_productId }),

            ]
        }

        case 'deleteAddress': {
            return [
                param("id")
                    .isInt()
                    .withMessage({ error: "Please enter valid addressId", error_Code: errorCode.Invalid_addressId }),
            ]
        }

        case 'createOrder': {
            return [
                body('deliveryAddressId')
                    .exists()
                    .withMessage({ error: "Delivery Address Id not entered", error_Code: errorCode.Delivery_Address_not_entered })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "Delivery Address Id not entered", error_Code: errorCode.Delivery_Address_not_entered })
                    .isNumeric()
                    .withMessage({ error: "Invalid Delivery Address Parameter type.", error_Code: errorCode.Invalid_deliveryAddress }),

                body('products')
                    .exists()
                    .withMessage({ error: "No products array given.", error_Code: errorCode.No_products_array_given })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No products array given.", error_Code: errorCode.No_products_array_given })
                    .bail()
                    .custom((value) => { return Array.isArray(value) })
                    .withMessage({ error: "Products parameter must be an array.", error_Code: errorCode.Products_must_be_array })
                    .bail()
                    .custom((value) => { return value.length > 0 })
                    .withMessage({ error: "Products array must contain atleast one object.", error_Code: errorCode.Products_array_empty })
                    .bail(),

                body('products.*')
                    .isObject()
                    .withMessage({ error: "Elements in products array must be objects.", error_Code: errorCode.Element_must_be_object })
                    .bail()
                    .custom((value) => {
                        let keys = Object.keys(value)
                        if (keys.length === 3) {
                            return (keys.includes('_id', 'productQuantity', 'amount'));
                        }
                        else return false;
                    })
                    .withMessage({ error: "Objects in products array must contain productId, productQuantity and amount only.", error_Code: errorCode.Object_must_contain_productId_and_productQuantity }),

                body('products.*._id')
                    .exists()
                    .withMessage({ error: "No product Id entered", error_Code: errorCode.No_product_id_entered })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product Id entered", error_Code: errorCode.No_product_id_entered })
                    .bail()
                    .isNumeric()
                    .withMessage({ error: "Product Id should be a number.", error_Code: errorCode.Invalid_productId })
                    .custom((value) => {
                        return Product.find({ _id: Long.fromString(value.toString()), deleted: 0 }).count().then(count => {
                            if (count > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Product not found.", error_Code: errorCode.Product_not_found })
                    .bail(),

                body('products.*.productQuantity')
                    .exists()
                    .withMessage({ error: "No product quantity entered.", error_Code: errorCode.No_quantityEntered })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "No product quantity entered.", error_Code: errorCode.No_quantityEntered })
                    .bail()
                    .isInt({ min: 1 })
                    .withMessage({ error: "Please enter a product quantity more than one.", error_Code: errorCode.Invalid_quantity }),
            ]
        }

        case 'completeOrder': {
            return [
                body('orderId')
                    .exists()
                    .withMessage({ error: "No order Id given.", error_Code: errorCode.No_order_id_entered })
                    .isNumeric()
                    .withMessage({ error: "Invalid order Id type entered.", error_Code: errorCode.Invalid_OrderId })
                    .custom((value) => {
                        return Order.find({ _id: Long.fromString(value.toString()), $or: [{ expiry: { $ne: null } }, { orderStatus: orderStatusUtils.paymentFailed }] }).count().then(count => {
                            if (count !== 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "No such incomplete order found with the given Id.", error_Code: errorCode.No_order_found })
                    .bail(),

                body('paymentTxHash')
                    .exists()
                    .withMessage({ error: "Payment Transaction Hash not entered.", error_Code: errorCode.paymentTxHash_not_entered })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "Payment Transaction Hash not entered.", error_Code: errorCode.paymentTxHash_not_entered })
                    .matches(/^0x([A-Fa-f0-9]{64})$/)
                    .withMessage({ error: "Invalid payment transaction hash.", error_Code: errorCode.Invalid_payment_transactionHash }),

                body('isFromCart')
                    // .exists()
                    // .withMessage({ error: "isFromCart not entered.", error_Code: errorCode.isFromCart_not_entered })
                    // .notEmpty({ ignore_whitespace: true })
                    // .withMessage({ error: "isFromCart not entered", error_Code: errorCode.isFromCart_not_entered })
                    .optional()
                    .isBoolean()
                    .withMessage({ error: "Invalid isFromCart parameter type. Should be true or false boolean.", error_Code: errorCode.Invalid_isFromCart_entered })
                    .custom(value => { return (typeof value).toString() === 'boolean'; })
                    .withMessage({ error: "Invalid isFromCart parameter type. Should be a true or false boolean.", error_Code: errorCode.Invalid_isFromCart_entered })
                    .custom((value, { req }) => {
                        return Order.findOne({ _id: req.body.orderId }).then(order => {
                            if (order.products.length > 1) {
                                if (value === true)
                                    return Promise.resolve()
                                else return Promise.reject()
                            }
                            else return Promise.resolve()
                        })
                    })
                    .withMessage({ error: "More than one product found. isIncart must be true. ", error_Code: errorCode.isInCart_must_be_true }),
            ]
        }

        case 'addDeviceToken': {
            return [
                body("deviceToken")
                    .exists()
                    .withMessage({ error: "Device token required", error_Code: errorCode.Device_token_required }),
            ]
        }

        case 'checkObjectId': {
            return [
                param("id")
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "Id cannot be empty!", error_Code: errorCode.Notification_id_is_empty })
                    .matches("^[0-9a-fA-F]{24}$")
                    .withMessage({ error: "Invalid Notification ID!", errorCode: errorCode.Invalid_notification_id }),
            ]
        }

        case 'addResponse': {
            return [
                body('orderId')
                    .exists()
                    .withMessage({ error: "No order Id provided.", error_Code: errorCode.No_order_id_entered })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Order Id cannot be empty!', error_Code: errorCode.OrderId_cannotbe_Empty })
                    .isNumeric()
                    .withMessage({ error: "Invalid order Id type entered.", error_Code: errorCode.Invalid_OrderId })
                    .custom((value) => {
                        return Order.find({ _id: Long.fromString(value.toString()), }).count().then(count => {
                            if (count !== 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "No  order found with the given Id.", error_Code: errorCode.No_order_found })
                    .bail(),

                body('productId')
                    .exists()
                    .withMessage({ error: "No product Id provided.", error_Code: errorCode.No_product_id_entered })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'productId cannot be empty!', error_Code: errorCode.Product_Id_not_provided })
                    .isNumeric()
                    .withMessage({ error: "Invalid productId type entered.", error_Code: errorCode.Invalid_productId })
                    .custom((value) => {
                        return Product.find({ _id: Long.fromString(value.toString()), }).count().then(count => {
                            if (count !== 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "No  product found with the given Id.", error_Code: errorCode.No_product_found })
                    .bail(),

                body('response')
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
        case 'notificationStatus': {
            return [
                query('status')
                    .exists()
                    .withMessage({ error: "Status not given", error_Code: errorCode.Notification_status_not_found })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: "Status not given", error_Code: errorCode.Notification_status_not_found })
                    .isIn([0, 1])
                    .withMessage({ error: "Invalid status value.", error_Code: errorCode.Invalid_notification_status })
            ]
        }

        case 'getRefundAmount': {
            return [

                param('orderId')
                    .isInt()
                    .withMessage({ error: "Please enter valid orderId", error_Code: errorCode.Invalid_OrderId }),

                query('productId')
                    .exists()
                    .withMessage({ error: "No product Id entered.", error_Code: errorCode.No_product_id_entered })
                    .notEmpty({ ignore_whitespace: true })
                    .withMessage({ error: 'Product Id  required', error_Code: errorCode.ProductId_Required })
                    .isNumeric()
                    .withMessage({ error: "Please enter valid productId", error_Code: errorCode.Invalid_productId })
                    .custom((value) => {
                        return Product.find({ _id: Long.fromString(value.toString()) }).count().then(count => {
                            if (count > 0)
                                return Promise.resolve()
                            else
                                return Promise.reject()
                        })
                    })
                    .withMessage({ error: "Product not found.", error_Code: errorCode.Product_not_found })
                    .bail(),

                query('productQuantity')
                    .exists()
                    .withMessage({ error: "No product quantity entered", error_Code: errorCode.No_quantityEntered })
                    .isInt({ gt: 0 })
                    .withMessage({ error: "Please enter valid productQuantity", error_Code: errorCode.Invalid_quantity }),
            ]
        }
    }
}

module.exports = { userValidator };