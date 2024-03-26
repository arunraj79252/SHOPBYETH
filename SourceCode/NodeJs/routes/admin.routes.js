const router = require("express").Router();
const admin = require('../controllers/admin.controller')
const { authenticateAdmin } = require('../middlewares/authentication.middleware');
const { adminValidator } = require('../validators/admin-validators');
const { productValidator } = require('../validators/product-validator')

const { categoryValidator, subCategoryValidator } = require('../validators/category-validators');

module.exports = app => {

    //Product Management
    router.post("/products/image", authenticateAdmin, admin.uploadProductImage);
    router.delete("/products/image/:file", authenticateAdmin, admin.deleteProductImage);
    router.post("/products", authenticateAdmin, adminValidator('addProduct'), admin.addProduct);
    router.put("/products/:id", authenticateAdmin, productValidator('productIdAdmin'), adminValidator('editProduct'), admin.editProduct);
    router.patch("/products", authenticateAdmin, productValidator('deleteProduct'), admin.deleteProduct);
    router.get("/products/:id", authenticateAdmin, productValidator('productIdAdmin'), admin.getProductDetail)
    router.get("/products", authenticateAdmin, productValidator('getProducts'), admin.getProducts)
    //product purchase history
    router.get("/products/:id/history", authenticateAdmin, productValidator('productIdAdmin'), admin.getProductPurchaseHistory)

    // router.post("/products/fake", admin.fake);  //api for creating fake data

    //AdminAccount
    router.post('/registerAdmin', admin.registerAdmin)
    router.post('/checkLogin', authenticateAdmin, admin.checkLogin)


    //Category Management
    router.post("/category", authenticateAdmin, categoryValidator, admin.addCategory);
    router.delete("/category/:id", authenticateAdmin, admin.deleteCategory);
    router.post("/category/subcategory", authenticateAdmin, subCategoryValidator, admin.addSubCategory);
    router.delete("/category/subcategory/:id", authenticateAdmin, admin.deleteSubCategory);
    router.put("/category/:id", categoryValidator, authenticateAdmin, admin.updateCategory);
    router.put("/category/subcategory/:id", subCategoryValidator, authenticateAdmin, admin.updateSubCategory);

    //Order Management
    router.get("/orders", authenticateAdmin, adminValidator('getOrders'), admin.viewOrders);
    router.get("/orders/:id", authenticateAdmin, adminValidator('getOrders'), admin.viewOrderDetails);
    router.patch("/orders/status", authenticateAdmin, adminValidator('updateOrderStatus'), admin.updateOrderStatus);

    //Dashboard Analytics
    router.get("/statistics", authenticateAdmin, admin.statistics);
    router.get("/statistics/sales", authenticateAdmin, adminValidator('orderAnalytics'), admin.orderAnalytics);
    router.get("/statistics/user", authenticateAdmin, adminValidator('userCount'), admin.getUserAnalytics);
    router.get("/statistics/products/viewCount", authenticateAdmin, admin.statisticsView_count);
    router.get("/statistics/products/saleCount", authenticateAdmin, admin.statisticsSale_count);

    //Brand Management
    router.post("/brand", authenticateAdmin, adminValidator('brandValidator'), admin.addBrand);
    router.put("/brand/:id", authenticateAdmin, adminValidator('brandValidator'), admin.updateBrand);
    router.delete("/brand/:id", authenticateAdmin, admin.deleteBrand);

    //type Management
    router.post("/type/:id", adminValidator('typeValidator'), authenticateAdmin, admin.addType);
    router.put("/type/:id", authenticateAdmin, adminValidator('typeValidator'), admin.updateType);
    router.delete("/type", authenticateAdmin, admin.deleteType);

    // Reward Coin Management
    router.get("/rewardCoinHistory", authenticateAdmin, adminValidator('userIdQuery'), admin.getUserRewardCoinHistory)

    //User Management
    router.get("/users", adminValidator("getUsers"), authenticateAdmin, admin.getUsers)
    router.get("/users/:userId", adminValidator('userId'), authenticateAdmin, admin.getUserDetail)
    router.patch("/users", adminValidator('userStatusValidator'), authenticateAdmin, admin.blockUser)

    //chat
    router.get("/viewResponse", authenticateAdmin, adminValidator('viewUserResponse'), admin.viewResponse)
    router.patch("/reply/:id", authenticateAdmin, adminValidator('addReply'), admin.addReply)
    router.get("/viewResponseDetails/:id", adminValidator('viewresponseDetail'), authenticateAdmin, admin.viewResponseDetails)

    //Home Image
    router.post("/upload/homeImage", authenticateAdmin, admin.uploadHomeImage);
    router.post("/add/homeImage", authenticateAdmin, adminValidator('addImage'), admin.addHomeImage);
    router.put("/edit/homeImage/:id", authenticateAdmin, adminValidator('editImage'), admin.editHomePage);
    router.delete("/image/:file", authenticateAdmin, admin.deleteImage);






    app.use('/api/admin', router);


}