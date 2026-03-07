const express = require("express");
const router = express.Router();
const userControllers = require("../controllers/authcontollers");
const authMiddleware = require("../middlewares/authMiddleware")
const adminMiddlwarre = require("../middlewares/adminMiddleware")
const { upload } = require("../config/cloudinary"); 




router.post("/register", upload.single("image"), userControllers.registerUser);
router.post("/login", userControllers.loginUser);
router.get("/all-users", authMiddleware.protect, adminMiddlwarre.isAdmin, userControllers.getAllUsers);

router.get("/logged-user", authMiddleware.protect, userControllers.getLoggedUser);

router.get("/logout", userControllers.logout);
router.put("/update-profile", authMiddleware.protect, upload.single("image"), userControllers.updateProfile);
router.post("/change-password", authMiddleware.protect, userControllers.changePassword);

module.exports = router;