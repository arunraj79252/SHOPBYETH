const { GeneralError } = require("../utils/errors");
const { logger, apiLogger } = require('../utils/logger.utils');

const handleErrors = (error, req, res, next) => {
    if (error instanceof GeneralError) {
        let log = `${error.getCode()} - 'error' - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`;
        logger.error(log);
        apiLogger.error(log)
        return res.status(error.getCode()).json({
            status: 'error',
            message: {
                error: error.message,
                error_Code: error.error_code
            }
        })
    }

    let log = `${error.status || 500} - 'error' - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`;
    logger.error(log);
    apiLogger.error(log)
    return res.status(500).json({
        status: 'error',
        message: {
            error: error.message,
            error_Code: error.error_code
        }
    })
}

module.exports = handleErrors;