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
        zipCode: String
    },
    items: [{
        productID: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: Number
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
        enum: ['Processing', 'Shipped', 'Delivered'], 
        default: 'Processing' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);