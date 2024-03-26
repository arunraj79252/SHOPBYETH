const { body } = require('express-validator')
const errorCode = require('../utils/error-code.utils')
const authValidator = (validationtype) => {
    switch (validationtype) {


        case 'login': {
            return [
                body('publicAddress')
                    .exists()
                    .withMessage({ error: "Public Address is required", error_Code: errorCode.Public_address_is_required }).bail()
                    .isEthereumAddress()
                    .withMessage({ error: 'Invalid Public Address', error_Code: errorCode.Invalid_public_address }).bail()
            ]
        }
        case 'sign': {
            return [
                body('signature')
                    .exists()
                    .withMessage({ error: 'Signature is required', error_Code: errorCode.Signature_is_required }).bail()
                    .isString()
                    .withMessage({ error: 'Invalid Signature', error_Code: errorCode.Invalid_signature }),
                body('publicAddress')
                    .exists()
                    .withMessage({ error: "Public Address is required", error_Code: errorCode.Public_address_is_required }).bail()
                    .isEthereumAddress()
                    .withMessage({ error: 'Invalid Public Address', error_Code: errorCode.Invalid_public_address })

            ]
        }
        case 'refreshToken': {
            return [
                body('refreshToken').exists()
                    .isString()
                    .withMessage({ error: 'Invalid Refresh Token', error_Code: errorCode.Invalid_refresh_token })

            ]
        }
    }
}

module.exports = { authValidator };
