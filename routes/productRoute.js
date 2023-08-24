const express = require('express')
const { getAllProducts, createProduct, updateProduct, deleteProduct, getProductDetails, createProductReview, getProductReviews, deleteReview, getAdminProducts, getCategoryProducts } = require('../controllers/productController');
const { isAuthenticated, authorizationRoles } = require('../middleware/auth');

const router = express.Router()




router.route("/products").get( getAllProducts );

router.route("/productsByCategory").get( getCategoryProducts );

router.route("/products/new").post(isAuthenticated, authorizationRoles("admin"), createProduct) ;

router.route("/admin/products").get(isAuthenticated, authorizationRoles("admin"), getAdminProducts) ;

router.route("/review/create").post(isAuthenticated, createProductReview) ;

router.route("/products/:id").get(getProductDetails)
                             .put(isAuthenticated, authorizationRoles("admin"), updateProduct)
                             .delete(isAuthenticated, authorizationRoles("admin"), deleteProduct) ;


router.route("/review").put(isAuthenticated, createProductReview)

router.route("/reviews").get(getProductReviews)
                        .delete(isAuthenticated, deleteReview) 


module.exports = router