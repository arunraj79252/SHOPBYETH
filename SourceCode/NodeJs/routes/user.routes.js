module.exports = app => {
    const router = require("express").Router();
    const { authenticate, authenticateRegistration } = require('../middlewares/authentication.middleware');
    const users = require("../controllers/user.controller.js");
    const { userValidator } = require('../validators/user-validator');
    const { productValidator } = require("../validators/product-validator");

    //user
    //Profile
    router.post("", authenticateRegistration, userValidator('registration'), users.registerUser);
    router.get("/me", authenticate, users.viewProfile);
    router.put("/me", authenticate, userValidator('updateUser'), users.updateProfile);

    //Address
    router.put("/me/address", authenticate, userValidator('addressValidate'), users.addAddress);
    router.patch("/me/address/:id", authenticate, userValidator('addressValidateUpdate'), users.updateAddress);
    router.delete("/me/address/:id", authenticate, userValidator('deleteAddress'), users.deleteAddress);
    router.get("/me/address", authenticate, users.listAddress);

    //Products
    router.get("/products/:id", productValidator('productId'), authenticate, users.getProductDetail);
    router.get("/products", productValidator('getProducts'), authenticate, users.getProducts);
    //router.get("/products/paymentInititated/:orderId", authenticate, users.paymentInititated)
    router.get("/counts", authenticate, users.getCounts)

    //wishlist
    router.get("/wishlist", authenticate, users.viewWislist);
    router.post("/wishlist", authenticate, users.addToWishlist)
    router.delete("/wishlist/:id", authenticate, productValidator('wishlist'), users.removeFromWishlist)

    //Cart
    router.post("/me/addToCart", authenticate, userValidator('addToCart'), users.addToCartItems);
    router.delete("/me/deleteCartItems/:productId", authenticate, userValidator('deleteCart'), users.deleteCart)
    router.get("/me/viewCartItems", authenticate, users.findCart)

    //orders
    router.post("/me/createOrder", authenticate, userValidator('createOrder'), users.createOrder)
    router.patch("/me/completeOrder", authenticate, userValidator('completeOrder'), users.completeOrder);
    router.get("/orders", userValidator('getOrders'), authenticate, users.viewOrders);
    router.get("/orders/:id", userValidator('getOrders'), authenticate, users.viewOrderDetails);
    router.patch("orders/checkPaymentStatus/:orderId", authenticate, users.checkPaymentTransactionStatus);
    router.patch("/me/cancelOrder/:id", userValidator('cancelOrder'), authenticate, users.cancelProduct)

    //Reward Coin History
    router.get("/me/rewardCoinHistory", authenticate, users.getRewardCoinHistory);


    //Feedback
    router.get("/products/myfeedback/:id", productValidator('productId'), authenticate, users.listUserFeedback)
    router.patch("/products/feedback", userValidator('addFeedback'), authenticate, users.addFeedback)
    router.delete("/products/feedback/:id/:feedbackId", productValidator('productId'), authenticate, users.removeFeedback)
    router.put("/products/feedback/:id/:feedbackId", productValidator('productId'), userValidator('editFeedback'), authenticate, users.editFeedback)
    //Feedback Image
    router.post("/products/feedback/image", authenticate, users.uploadFeedbackImage);
    router.delete("/products/feedbackimage/:file", authenticate, users.deleteFeedbackImage);


    //Returnstatus
    router.patch("/orders/returnStatus/:orderId", authenticate, userValidator('returnOrder'), users.returnProduct);
    router.get("/orders/:orderId/getRefundAmount", authenticate, userValidator('getRefundAmount'), users.getRefundAmount);

    //notification
    router.patch("/me/notification/token", authenticate, userValidator('addDeviceToken'), users.addNotificationToken);
    router.get("/me/notification", authenticate, users.listNotification);
    router.patch("/me/notification/:id", authenticate, userValidator('checkObjectId'), users.updateNotificationStatus);
    router.patch("/me/notification", authenticate, userValidator('notificationStatus'), users.updateNotificationStatusAll);
    router.get("/me/notification/count/:status", authenticate, users.returnNotificationStatusCount);

    //Chat
    router.post("/me/addResponse", authenticate, userValidator('addResponse'), users.addResponse)

    //Feedback Image
    router.post("/products/feedback/image", authenticate, users.uploadFeedbackImage);
    
    

    router.delete("/products/feedbackimage/:file", users.deleteFeedbackImage);


    app.use('/api/users', router);





}