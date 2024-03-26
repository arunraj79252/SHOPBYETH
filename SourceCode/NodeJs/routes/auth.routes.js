const router = require("express").Router();
const auth = require("../controllers/auth.controller.js");
const authValidator = require('../validators/auth-validators');


module.exports = app => {
    //login first check
    router.post("", authValidator.authValidator('login'), auth.login);
    router.put("", authValidator.authValidator('refreshToken'), auth.refreshToken);
    router.post("/verify", authValidator.authValidator('sign'), auth.verifySign);
    router.post("/admin/login", auth.adminLogin);
    router.put("/admin/login", auth.adminRefreshToken);

    app.use('/api/auth', router);

}