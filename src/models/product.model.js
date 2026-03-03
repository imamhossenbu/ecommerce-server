const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },

    // Original Price
    regularPrice: {
      type: Number,
      required: [true, "Regular price is required"],
    },

    // Selling Price (The actual price after discount)
    salePrice: {
      type: Number,
      required: [true, "Sale price is required"],
      validate: {
        validator: function (value) {
          // Ensuring sale price isn't higher than original price
          return value <= this.regularPrice;
        },
        message: "Sale price cannot be higher than regular price",
      },
    },

    // Main image for Shop Page (Single String)
    thumbnail: {
      type: String,
      required: [true, "Main thumbnail image is required"],
    },

    // Gallery images for Details Page (Array of Strings)
    images: {
      type: [String],
      required: [true, "At least one gallery image is required"],
    },

    categoryID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
    },

    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
