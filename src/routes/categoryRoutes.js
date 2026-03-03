const express = require("express");
const router = express.Router();
const categoryControllers = require("../controllers/categoryControllers");
const { upload } = require("../config/cloudinary");
const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

// URL: POST /api/auth/register
router.post(
  "/create-category",
  protect,
  isAdmin,
  upload.single("image"),
  categoryControllers.createCategory,
);
router.get("/categories",  categoryControllers.getAllCategories);

router.delete("/delete-cat/:id", protect, isAdmin, categoryControllers.deleteCategory);

module.exports = router;
         