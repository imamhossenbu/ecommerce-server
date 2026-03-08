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
                console.log("SSL Error Response:", apiResponse); 
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
    res.redirect('https://ecommerce-with-react-3ljc.vercel.app/success'); 
};

// Payment Fail/Cancel Handler
exports.paymentFail = async (req, res) => {
    const { tranId } = req.params;
    await Order.findOneAndDelete({ transactionId: tranId }); 
    res.redirect('https://ecommerce-with-react-3ljc.vercel.app/cancel');
};

exports.paymentCancel = async (req, res) => {
    const { tranId } = req.params;
    await Order.findOneAndUpdate({ transactionId: tranId }, { paymentStatus: 'Cancelled' });
    res.redirect('https://ecommerce-with-react-3ljc.vercel.app/cancel');
};


exports.getMyOrders = async (req, res) => {
    try {
        const userEmail = req.user.email; 
        const orders = await Order.find({ "customerInfo.email": userEmail }).sort({ createdAt: -1 });
        
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params; 
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    
    if (order.customerInfo.email !== req.user.email) {
        return res.status(401).json({ success: false, message: "Unauthorized access" });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error("GetOrder Error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Server Error", 
      error: error.message 
    });
  }
};


// Get All Orders (Admin Only)
exports.getAllOrders = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

      
        let query = {};
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query.$or = [
                { transactionId: searchRegex },
                { "customerInfo.firstName": searchRegex },
                { "customerInfo.lastName": searchRegex },
                { "customerInfo.email": searchRegex }
            ];
        }

        if (req.query.status) query.paymentStatus = req.query.status;
        if (req.query.orderStatus) query.orderStatus = req.query.orderStatus;

   
        const totalOrders = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        
        const stats = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$totalAmount", 0] } },
                    totalOrders: { $sum: 1 },
                    pendingOrders: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Pending"] }, 1, 0] } },
                    outOfStockItems: { $sum: 0 } 
                }
            }
        ]);

        const summary = stats.length > 0 ? stats[0] : { totalRevenue: 0, totalOrders: 0, pendingOrders: 0 };

        res.status(200).json({
            success: true,
            totalProducts: totalOrders, 
            totalPages: Math.ceil(totalOrders / limit),
            currentPage: page,
            stats: summary, 
            data: orders
        });
    } catch (error) {
        console.error("GetAllOrders Error:", error.message);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};



exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params; 
        const { status } = req.body; 
    
        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required" });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { orderStatus: status },
            { new: true, runValidators: true } 
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            data: updatedOrder
        });
    } catch (error) {
        console.error("UpdateOrderStatus Error:", error.message);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};


