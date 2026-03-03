const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Frontend theke order create kora
router.post('/create-checkout-session', paymentController.createCheckoutSession);

// SSLCommerz theke redirection
router.post('/success/:tranId', paymentController.paymentSuccess);
router.post('/fail/:tranId', paymentController.paymentFail);
router.post('/cancel/:tranId', paymentController.paymentCancel);

module.exports = router;