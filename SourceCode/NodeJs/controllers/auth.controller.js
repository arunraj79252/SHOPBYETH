
const db = require("../models");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const ethUtil = require('ethereumjs-util');
const { validationResult } = require('express-validator');
const { BadRequest, Unauthorized, NotFound, GeneralError, Forbidden } = require('../utils/errors');
require('dotenv').config()
const User = db.user;
const Signature = db.signature;
const Admin = db.admin;
const errorCode = require('../utils/error-code.utils');
const tokenConfig = require("../config/token.config");
const { logger } = require("../utils/logger.utils")

//Refresh Token
exports.refreshToken = (req, res, next) => {
    try {
        jwt.verify(req.body.refreshToken, process.env.userRefreshTokenSecret, function (error, decoded) {
            let currentDate = new Date();
            let token = jwt.sign(
                {
                    data: decoded.data,
                }, process.env.userAccessTokenSecret,
                {
                    expiresIn: tokenConfig.userAccessTokenExpiry,
                }
            )
            let refreshtoken = jwt.sign(
                {
                    data: decoded.data,
                }, process.env.userRefreshTokenSecret,
                {
                    expiresIn: tokenConfig.userRefreshTokenExpiry,
                }
            )
            let futureDate = new Date(currentDate.getTime() + 10 * 60000);
            let refreshTokenExpTime = new Date(currentDate.getTime() + 24 * 60 * 60000);
            return res.send({
                accessToken: token,
                refreshToken: refreshtoken,

                accessTokenExpiresIn: futureDate,

                refreshTokenExpiresIn: refreshTokenExpTime,
            })
        });
    }
    catch {
        return next(new Unauthorized(`Invalid Token`, errorCode.Invalid_access_token));
    }
}

//Login Function
exports.login = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }

    //Check whether public address already exist or not inside signature table
    Signature.findOne(req.body)
        .then(data => {
            const reqBody = {
                publicAddress: req.body.publicAddress.toLowerCase(),
                nonce: Math.floor(Math.random() * 1000000)
            }
            Signature.findByIdAndUpdate(data.id, reqBody)
                .then(data => {
                    if (!data) {
                        console.error(`User signature not found for user: ${data.id}`)
                    }
                })
                .catch(error => {
                    console.error(`Error obtaining user signature. Error: ${error}`)
                });
            return res.send({
                publicAddress: data.publicAddress,
                nonce: '$h0pByETH' + reqBody.nonce.toString()
            });
        })
        .catch(error => {
            console.log(`Error in finding signature for ${req.body.publicAddress}. Error: ${error}`)
            // create if not found 
            let signature = new Signature({
                publicAddress: req.body.publicAddress.toLowerCase(),
                nonce: Math.floor(Math.random() * 1000000),
            })
            signature
                .save(signature)
                .then(data => {
                    return res.send({
                        publicAddress: req.body.publicAddress.toLowerCase(),
                        nonce: '$h0pByETH' + data.nonce.toString()
                    });
                })
                .catch(error => {
                    logger.error(`Error occured while creating user signature. Error: ${error}. Request: ${req.originalUrl} - ${req.method} - ${req.ip}`)
                    return next(new GeneralError(`Some error occurred while creating user signature.`, errorCode.Error_creating_user_signature));
                });
        });
};

//Verify Signature
exports.verifySign = (req, res, next) => {
    let userStatus;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errObj = errors.errors[0].msg;
        return next(new BadRequest(errObj.error, errObj.error_Code));
    }

    //Json Object
    let reqBody = {
        publicAddress: req.body.publicAddress.toLowerCase()

    };
    let reqUserBody = {
        _id: req.body.publicAddress.toLowerCase()
    };

    //Check whether public address exist in signature table or not
    return (
        Signature.findOne(reqBody).then(data => {
            if (!data) {
                console.error(`User with publicAddress ${req.body.publicAddress.toLowerCase()} not found in database`);
                return next(new Unauthorized(`User Signature not found.`, errorCode.Signature_not_found));
            }
            const msg = '$h0pByETH' + data.nonce.toString();
            // Convert msg to hex string
            const sig = ethUtil.fromRpcSig(ethUtil.addHexPrefix(req.body.signature))
            const msg1 = ethUtil.hashPersonalMessage(Buffer.from(msg))
            const publicKey = ethUtil.ecrecover(msg1, sig.v, sig.r, sig.s)
            const pubAddress = ethUtil.pubToAddress(publicKey)
            const address = ethUtil.addHexPrefix(pubAddress.toString('hex'))
            // The signature verification is successful if the address found with

            if (address.toLowerCase() === req.body.publicAddress.toLowerCase()) {
                let token = jwt.sign(
                    {
                        data: req.body.publicAddress.toLowerCase()
                    }, process.env.userAccessTokenSecret,
                    { expiresIn: tokenConfig.userAccessTokenExpiry }
                )
                let refreshtoken = jwt.sign(
                    {
                        data: req.body.publicAddress.toLowerCase()
                    }, process.env.userRefreshTokenSecret,
                    { expiresIn: tokenConfig.userRefreshTokenExpiry }
                )

                //Check whether user is already registered or not(status)
                User.findOne(reqUserBody)
                    .then((data) => {
                        if (data) {
                            if (data.status === 0) {
                                return next(new Forbidden("User is blocked by Admin.", errorCode.User_is_blocked))
                            }
                            else {
                                userStatus = 1;
                                return res.send({
                                    publicAddress: req.body.publicAddress.toLowerCase(),
                                    accessToken: token,
                                    refreshToken: refreshtoken,
                                    name: data.name,
                                    status: userStatus
                                })
                            }
                        }
                        else
                            userStatus = 0;
                        return res.send({
                            publicAddress: req.body.publicAddress.toLowerCase(),
                            accessToken: token,
                            refreshToken: refreshtoken,
                            name: '',
                            status: userStatus
                        })
                    })
            } else {
                return next(new Unauthorized(`User not found.`, errorCode.User_not_Found))
            }
        })
            .catch(error => {
                console.error(`Error verifying signature. Error: ${error}`)
                return next(new GeneralError(`Error verifying signature.`, errorCode.Error_verifying_signature))
            })
    );
};

function generateAdminTokens(id, username) {
    const token = jwt.sign(
        {
            _id: id
        }, process.env.adminAccessTokenSecret,
        {
            expiresIn: tokenConfig.adminAccessTokenExpiry
        });
    const refreshToken = jwt.sign(
        {
            username: username
        }, process.env.adminRefreshTokenSecret,
        {
            expiresIn: tokenConfig.adminRefreshTokenExpiry
        });
    return { token, refreshToken }
}

exports.adminLogin = async (req, res, next) => {
    let admin = await Admin.findOne({ username: req.body.username })
    if (!admin) {
        return next(new Unauthorized("Incorrect username or password", errorCode.Invalid_username_or_password));
    }
    const validPassword = await bcrypt.compare(req.body.password, admin.password);
    if (!validPassword) {
        return next(new Unauthorized("Incorrect username or password", errorCode.Invalid_username_or_password));
    }
    const { token, refreshToken } = generateAdminTokens(admin._id, admin.username)
    res.header('x-auth-token', token).send({ status: "Login Sucessful.", token, refreshToken })
}

function checkAdminRefreshTokenValidity(token) {
    const data = jwt.verify(token, process.env.adminRefreshTokenSecret, function (error, decoded) {
        return decoded ? decoded : error
    });
    return data
}

exports.adminRefreshToken = (req, res, next) => {
    if (req.body.refreshToken) {
        const refreshToken = checkAdminRefreshTokenValidity(req.body.refreshToken)
        if (refreshToken.username) {
            Admin.findOne({ username: refreshToken.username }).then(admin => {
                const { token, refreshToken } = generateAdminTokens(admin._id, admin.username)
                res.header('x-auth-token', token).send({ status: "Refresh Token Generation Successful.", token, refreshToken })
            })
        }
        else {
            return next(new Unauthorized("Invalid Refresh Token", errorCode.Invalid_refresh_token))
        }
    }
    else {
        return next(new BadRequest("No refresh token provided.", errorCode.Invalid_refresh_token))
    }
}