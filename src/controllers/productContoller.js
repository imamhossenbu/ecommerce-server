const Product = require("../models/product.model");

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
    } = req.body;

    
    if (!req.files || !req.files.thumbnail) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please upload a main thumbnail image",
        });
    }

    
    const thumbnailUrl = req.files.thumbnail[0].path;


  
    let galleryImages = [];
    if (req.files.images) {
      galleryImages = req.files.images.map((file) => file.path);
    }


   
    const product = await Product.create({
      name,
      description,
      regularPrice,
      salePrice,
      thumbnail: thumbnailUrl,
      images: galleryImages,
      categoryID,
      stock: stock || 0,
      isFeatured: isFeatured || false,
    });

    res.status(201).json({
      success: true,
      message: "Product created with images!",
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    res.status(200).json({
      success: true,
      data: product,
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

    const category = req.query.category ? { category: req.query.category } : {};

  
    const totalProducts = await Product.countDocuments({ ...keyword, ...category });
    const products = await Product.find({ ...keyword, ...category })
      .populate("categoryID", "name")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 }); 

    // response
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


module.exports = { 
  createProduct, 
  getProductDetails,
  getAllProducts,
 deleteProduct
 };


