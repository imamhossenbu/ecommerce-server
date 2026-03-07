const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require("../middlewares/authMiddleware")


// Frontend theke order create kora
router.post('/create-checkout-session', paymentController.createCheckoutSession);

// SSLCommerz theke redirection
router.post('/success/:tranId', paymentController.paymentSuccess);
router.post('/fail/:tranId', paymentController.paymentFail);
router.post('/cancel/:tranId', paymentController.paymentCancel);
router.get('/my-orders', authMiddleware.protect, paymentController.getMyOrders);
router.get("/order/:orderId", authMiddleware.protect, paymentController.getOrderById);

module.exports = router;