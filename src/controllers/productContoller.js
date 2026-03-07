const Product = require("../models/product.model");
const Review = require('../models/review.model');

const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      regularPrice,
      salePrice,
      categoryID,
      stock,
      isFeatured,
      isBestseller, 
      isNew,       
      straight_up,  
      lowdown,
      thumbnail, // সরাসরি URL আসছে
      images     // সরাসরি URL এর Array আসছে
    } = req.body;

    console.log("Request Body:", req.body);

    // ১. ভ্যালিডেশন (ফাইল নয়, এখন URL চেক হবে)
    if (!thumbnail) {
      return res.status(400).json({
        success: false,
        message: "Main thumbnail image is required!",
      });
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
       return res.status(400).json({
         success: false,
         message: "At least one gallery image is required!",
       });
    }

    // ২. প্রোডাক্ট ডাটা সাজানো
    const productData = {
      name,
      description,
      regularPrice: Number(regularPrice),
      salePrice: Number(salePrice),
      thumbnail, // ফ্রন্টএন্ড থেকে আসা URL
      images,    // ফ্রন্টএন্ড থেকে আসা Array of URLs
      categoryID,
      stock: Number(stock) || 0,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isBestseller: isBestseller === 'true' || isBestseller === true,
      isNew: isNew === 'true' || isNew === true,
      straight_up,
      lowdown: Array.isArray(lowdown) ? lowdown : [lowdown] 
    };

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: "Product created successfully!",
      data: product,
    });
  } catch (error) {
    console.error("Creation Error:", error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};


//  GET /api/products/:id
const getProductDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("categoryID", "name");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });
    }

    const reviews = await Review.find({ productID: req.params.id });
    const totalReviews = reviews.length;
    
    const avgRating = totalReviews > 0 
      ? (reviews.reduce((sum, rev) => sum + rev.rating, 0) / totalReviews).toFixed(1) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        ...product._doc, 
        totalReviews: totalReviews,
        avgRating: Number(avgRating)
      },
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Invalid Product ID" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

//Get all products with Pagination & Search

const getAllProducts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20; 
    const skip = (page - 1) * limit;

    const keyword = req.query.search
      ? { name: { $regex: req.query.search, $options: "i" } }
      : {};

    const category = req.query.category ? { categoryID: req.query.category } : {};


    let sortBy = { createdAt: -1 }; 

    if (req.query.sort) {
      const sortField = req.query.sort;
      
      if (sortField === 'price') sortBy = { salePrice: 1 };       
      else if (sortField === '-price') sortBy = { salePrice: -1 }; 
      else if (sortField === 'name') sortBy = { name: 1 };       
      else if (sortField === '-name') sortBy = { name: -1 };      
      else if (sortField === '-createdAt') sortBy = { createdAt: -1 }; 
    }


    const totalProducts = await Product.countDocuments({ ...keyword, ...category });
    
    const products = await Product.find({ ...keyword, ...category })
      .populate("categoryID", "name")
      .limit(limit)
      .skip(skip)
      .sort(sortBy); 

    // ৫. রেসপন্স
    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      data: products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });
    }

    
    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




const getBestsellers = async (req, res) => {
  try {
    // শুধু যাদের isBestseller true তাদের ফিল্টার করবে
    const products = await Product.find({ isBestseller: true })
      .populate("categoryID", "name")
      .limit(4) 
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getNewArrivals = async (req, res) => {
  try {
   
    const products = await Product.find()
      .populate("categoryID", "name")
      .sort({ createdAt: -1 }) 
      .limit(4); 

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });


    let updateData = { ...req.body };
    if (req.files) {
      if (req.files.thumbnail) updateData.thumbnail = req.files.thumbnail[0].path;
      if (req.files.images) updateData.images = req.files.images.map(file => file.path);
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};





module.exports = { 
  createProduct, 
  getProductDetails,
  getAllProducts,
 deleteProduct,
  getBestsellers,
  getNewArrivals,
  updateProduct
 };


