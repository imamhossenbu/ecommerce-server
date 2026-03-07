const express = require('express');
const router = express.Router();
const { getDashboardStats, getManageCustomers,deleteUser, updateProfile , updateAdminSettings} = require('../controllers/adminController');
const { protect } = require("../middlewares/authMiddleware"); 
const { isAdmin } = require("../middlewares/adminMiddleware");


router.get('/stats', protect, isAdmin, getDashboardStats);
router.get('/manage-customers', protect, isAdmin, getManageCustomers);
router.delete("/delete-user/:id", protect, isAdmin, deleteUser);
router.patch("/update-profile", protect, isAdmin, updateProfile);
router.put('/update-settings', protect, isAdmin, updateAdminSettings);

module.exports = router;



