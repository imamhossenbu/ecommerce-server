const Category = require("../models/category.model");
const prodcutModel = require("../models/product.model");
const fs = require('fs');

// ১. Create Category
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a category image" });
    }

    const category = await Category.create({
      name,
      image: req.file.path,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. Get All Categories (With Pagination & Search)
const getAllCategories = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const keyword = req.query.search
      ? { name: { $regex: req.query.search, $options: "i" } }
      : {};

    const totalCategories = await Category.countDocuments({ ...keyword });
    const categories = await Category.find({ ...keyword })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      totalCategories,
      totalPages: Math.ceil(totalCategories / limit),
      currentPage: page,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    let category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found!" });
    }

    const updateData = { name };
    
    if (req.file) {
      updateData.image = req.file.path;
    }

    category = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Category updated successfully!",
      data: category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. Delete Category
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found!",
      });
    }

    const productCount = await prodcutModel.countDocuments({ categoryID: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({ 
        success: false,
        message: "Cannot delete category with active products" 
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
};