const SSLCommerzPayment = require('sslcommerz-lts');
const Order = require('../models/Order');

// SSLCommerz Configuration
const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASSWORD;
const is_live = false; 

exports.createCheckoutSession = async (req, res) => {
    try {
        const { customerInfo, items, totalAmount, shippingFee } = req.body;
        const transactionId = `TXN-${Date.now()}`;

       const data = {
    total_amount: parseFloat(totalAmount),
    currency: 'BDT',
    tran_id: transactionId,
    success_url: `http://localhost:5001/api/payment/success/${transactionId}`,
    fail_url: `http://localhost:5001/api/payment/fail/${transactionId}`,
    cancel_url: `http://localhost:5001/api/payment/cancel/${transactionId}`,
    ipn_url: `http://localhost:5001/api/payment/ipn`,
    shipping_method: 'Courier',
    product_name: 'Skincare Products',
    product_category: 'Skincare',
    product_profile: 'general',

    // --- Customer Information ---
    cus_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
    cus_email: customerInfo.email,
    cus_add1: customerInfo.address || 'Dhaka',
    cus_city: customerInfo.city || 'Dhaka',
    cus_postcode: customerInfo.zipCode || '1000',
    cus_country: 'Bangladesh',
    cus_phone: customerInfo.phone,

    // --- Shipping Information (EIGULO MISSING CHILO) ---
    ship_name: `${customerInfo.firstName} ${customerInfo.lastName}`, // Name pathatei hobe
    ship_add1: customerInfo.address || 'Dhaka',
    ship_city: customerInfo.city || 'Dhaka',
    ship_state: customerInfo.state || 'Dhaka',
    ship_postcode: customerInfo.zipCode || '1000',
    ship_country: 'Bangladesh',
};
        // DB save
        const newOrder = new Order({
            customerInfo,
            items,
            totalAmount,
            shippingFee,
            transactionId,
            paymentStatus: 'Pending'
        });
        await newOrder.save();

        // SSLCommerz Request
        const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
        
        sslcz.init(data).then(apiResponse => {
           console.log(apiResponse)
            if (apiResponse?.GatewayPageURL) {
                res.status(200).json({ success: true, url: apiResponse.GatewayPageURL });
            } else {
                console.log("SSL Error Response:", apiResponse); // Console-e error paben
                res.status(400).json({ 
                    success: false, 
                    message: apiResponse?.failedreason || "SSLCommerz session failed" 
                });
            }
        });

    } catch (error) {
        console.error("Internal Server Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Payment Success Handler
exports.paymentSuccess = async (req, res) => {
    const { tranId } = req.params;
    await Order.findOneAndUpdate({ transactionId: tranId }, { paymentStatus: 'Paid' });
    // Frontend-er success page-e redirect
    res.redirect('https://ecommerce-frontend-amber-eight.vercel.app/success.html'); 
};

// Payment Fail/Cancel Handler
exports.paymentFail = async (req, res) => {
    const { tranId } = req.params;
    await Order.findOneAndDelete({ transactionId: tranId }); // Order muche dewa ba status change
    res.redirect('https://ecommerce-frontend-amber-eight.vercel.app/cancel.html');
};

exports.paymentCancel = async (req, res) => {
    const { tranId } = req.params;
    await Order.findOneAndUpdate({ transactionId: tranId }, { paymentStatus: 'Cancelled' });
    res.redirect('https://ecommerce-frontend-amber-eight.vercel.app/cancel.html');
};