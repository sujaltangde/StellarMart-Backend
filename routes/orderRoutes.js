const express = require('express') 
const {isAuthenticated, authorizationRoles} = require('../middleware/auth.js') ;
const {newOrder, getSingleOrder, myOrders, getAllOrders, updateOrder, deleteOrder} = require('../controllers/orderController.js')
const router = express.Router()



router.route("/order/new").post(isAuthenticated, newOrder) 

router.route("/order/:id").get(isAuthenticated , getSingleOrder)
    
router.route("/orders/me").get(isAuthenticated, myOrders) ;

router.route("/admin/orders").get(isAuthenticated, authorizationRoles("admin"), getAllOrders)

router.route("/admin/order/:id").put(isAuthenticated, authorizationRoles("admin"), updateOrder)
                                .delete(isAuthenticated, authorizationRoles("admin"), deleteOrder)



module.exports = router ;