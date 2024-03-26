class GeneralError extends Error {
    constructor(message, error_code) {
        super();
        this.message = message;
        this.error_code = error_code;
    }

    getCode() {
        if (this instanceof BadRequest) {
            return 400;
        } else if (this instanceof NotFound) {
            return 404;
        } else if (this instanceof Forbidden) {
            return 403;
        } else if (this instanceof Unauthorized) {
            return 401;
        }
        return 500;
    }
}

class BadRequest extends GeneralError { }
class NotFound extends GeneralError { }
class Forbidden extends GeneralError { }
class Unauthorized extends GeneralError { }

module.exports = {
    GeneralError,
    BadRequest,
    NotFound,
    Forbidden,
    Unauthorized
}