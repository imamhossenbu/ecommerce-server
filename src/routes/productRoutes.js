const express = require("express");
const router = express.Router();
const productContollers = require("../controllers/productContoller");
const { upload } = require("../config/cloudinary");
const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");


const productUpload = upload.fields([
  { name: "thumbnail", maxCount: 1 }, 
  { name: "images", maxCount: 10 }, 
]);


router.post("/create-product", protect, isAdmin,  productUpload, productContollers.createProduct);
router.get("/product/:id", productContollers.getProductDetails)
router.get("/products",  productContollers.getAllProducts)
router.delete("/product-delete/:id", protect, isAdmin, productContollers.deleteProduct)

module.exports = router;
