const { product } = require("../models/index.js");
const { publicValidator } = require("../validators/public-validator.js");

module.exports = app => {
    const router = require("express").Router();
    const publicController = require('../controllers/public.controller.js')
    const { productValidator } = require("../validators/product-validator.js");


    //Products
    router.get("/products", productValidator('getProducts'), publicController.getProducts);
    router.get("/products/:id", productValidator('productId'), publicController.getProductDetail);
    router.post("/products/productInfo", productValidator('productInfo'), publicController.getProductInfo)
    router.get("/products/similarProducts/:id", productValidator('productId'), publicController.listSimilarProducts);

    //feedback
    // router.get("/products/feedback/:id", productValidator('productId'), publicController.viewProductReviews)
    //category
    router.get("/category", publicValidator('list-category-subcategory-brand'), publicController.getCategories);
    router.get("/category/:id", publicValidator('list-category-subcategory-brand'), publicController.getSubCategories);
    //brand
    router.get("/brand", publicValidator('list-category-subcategory-brand'), publicController.listBrand);
    //type
    router.get("/type/:id", publicController.listType);

    //feedback
    router.get("/products/feedback/:id",publicValidator('getFeedbacks'), publicController.listFeedbacks);

    //Home Image
    router.get("/homeImage", publicController.getHomeImage)
    router.get("/homeImage/details/:id", publicValidator('viewImageDetail'),publicController.viewImageDetails)

    app.use('/api/public', router);

}