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

router.get("/logout", userControllers.logout)

module.exports = router;