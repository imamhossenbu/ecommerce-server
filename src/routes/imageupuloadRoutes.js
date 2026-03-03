
const express = require("express");
const router = express.Router();


const { uploadImage } = require("../controllers/imageUploadContollers");
const { upload } = require("../config/cloudinary"); 
const { protect } = require("../middlewares/authMiddleware");


router.post("/upload-image", protect, upload.single("image"), uploadImage);

module.exports = router;