const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerInfo: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        address: String,
        city: String,
        state: String,
        zipCode: String,
        country: String // এটিও যোগ করে দিন যেহেতু ফ্রন্টএন্ডে আছে
    },
    items: [{
        productID: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: Number,
        image: String 
    }],
    totalAmount: Number,
    shippingFee: Number,
    transactionId: String, 
    paymentStatus: { 
        type: String, 
        enum: ['Pending', 'Paid', 'Failed', 'Cancelled'], 
        default: 'Pending' 
    },
    orderStatus: { 
        type: String, 
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], 
        default: 'Processing' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);