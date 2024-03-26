const db = require("../models");
const User = db.user;
const Admin = db.admin;
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger.utils');
require('dotenv').config();
const { Unauthorized, Forbidden, NotFound, BadRequest } = require('../utils/errors.js');
const errorCodeUtils = require("../utils/error-code.utils");

const authenticate = async (req, res, next) => {
    const access_token = req.header('Authorization');
    if (!access_token) {
        return next(new Unauthorized("No Access Token Provided.", errorCodeUtils.No_access_token_provided));
    }
    if (!access_token.startsWith('SHOPBYETH')) {
        return next(new Unauthorized("Invalid Access Token!", errorCodeUtils.Invalid_access_token));
    }
    else {
        try {
            checkTokenValidity(access_token.replace('SHOPBYETH ', '')).then(token => {
                User.findOne({ _id: token.data }).select(['-__v']).select(['-updatedAt']).select(['-createdAt']).then(user => {
                    req.user = user;
                    if (user) {
                        if (user.status === 0) {
                            return next(new Forbidden("User is blocked by Admin.", errorCodeUtils.User_is_blocked))
                        } else {
                            next();
                        }
                    } else { return next(new NotFound("User not found.", errorCodeUtils.User_not_Found)) }
                })
            }).catch(error => {
                console.error("Error: ", error)
                return next(new Unauthorized("Invalid Token!", errorCodeUtils.Invalid_access_token));
            })
        } catch (error) {
            logger.error(`${error.status} - 'error' - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
            return next(new Unauthorized("Invalid Token!", errorCodeUtils.Invalid_access_token));
        }
    }
}

const authenticateRegistration = async (req, res, next) => {
    const access_token = req.header('Authorization');
    if (!access_token) {
        return next(new Unauthorized("No Access Token Provided.", errorCodeUtils.No_access_token_provided));
    }
    if (!access_token.startsWith('SHOPBYETH')) {
        if (req.body.publicAddress) {
            if (typeof req.body.publicAddress != 'string')
                return next(new BadRequest("Invalid public address", 100))
        }
        else {
            return next(new BadRequest("Please provide public address", 100))

        }
        return next(new Unauthorized("Invalid Access Token!", errorCodeUtils.Invalid_access_token));
    }
    else {
        try {
            checkTokenValidity(access_token.replace('SHOPBYETH ', '')).then(token => {
                if (token.data.toLowerCase() === req.body.publicAddress.toLowerCase())
                    next();
                else {
                    return next(new Unauthorized("Invalid Token!", errorCodeUtils.Invalid_access_token));
                }
            }).catch(error => {
                console.error("Error: ", error)
                return next(new Unauthorized("Invalid Token!", errorCodeUtils.Invalid_access_token));
            })
        } catch (error) {
            logger.error(`${error.status} - 'error' - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
            return next(new Unauthorized("Invalid Token!", errorCodeUtils.Invalid_access_token));
        }
    }
}

function checkTokenValidity(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.userAccessTokenSecret, function (error, decoded) {
            if (decoded)
                resolve(decoded)
            else
                reject(error)
        });
    })
}

function checkAdminTokenValidity(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.adminAccessTokenSecret, function (error, decoded) {
            if (decoded)
                resolve(decoded)
            else
                reject(error)
        });
    })
}

const authenticateAdmin = async (req, res, next) => {
    const access_token = req.header('Authorization');
    if (!access_token) {
        return next(new Unauthorized("No Access Token Provided.", errorCodeUtils.No_access_token_provided));
    }
    if (!access_token.startsWith('ADMIN@SHOPBYETH')) {
        return next(new Unauthorized("Invalid Access Token!", errorCodeUtils.Invalid_access_token));
    }
    else {
        try {
            checkAdminTokenValidity(access_token.replace('ADMIN@SHOPBYETH ', '')).then(token => {
                Admin.findOne({ _id: token._id }).then(admin => {
                    if (admin) {
                        next();
                    }
                    else {
                        return next(new Unauthorized("Admin user not found!", errorCodeUtils.User_not_Found));
                    }
                })
            }).catch(error => {
                console.error(`Error: ${error}`)
                return next(new Unauthorized("Invalid Access Token!", errorCodeUtils.Invalid_access_token));
            })
        } catch (error) {
            logger.error(`${error.status} - 'error' - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
            return next(new Unauthorized("Invalid Access Token!", errorCodeUtils.Invalid_access_token));
        }
    }
}

module.exports = { authenticate, authenticateAdmin, authenticateRegistration };
