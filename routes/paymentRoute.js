const express = require('express')
const router = express.Router()
const { isAuthenticated } = require('../middleware/auth')
const { processPayment, sendStripeApiKey } = require('../controllers/paymentController')



router.route("/payment/process").post(isAuthenticated, processPayment)

router.route("/stripeApiKey").get(isAuthenticated, sendStripeApiKey)


module.exports = router ;