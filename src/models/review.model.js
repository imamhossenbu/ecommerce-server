const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  productID: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);