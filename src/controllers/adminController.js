const Order = require("../models/Order");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({ paymentStatus: "Paid" });
    const totalCustomers = await User.countDocuments({ role: "user" });
    const orders = await Order.find({ paymentStatus: "Paid" });
    const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const topProducts = await Product.find().limit(5); 

    const rawSalesData = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id": 1 } }
    ]);

  
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
  
    const salesData = monthNames.map((month, index) => {
      const monthNumber = index + 1;
      const foundMonth = rawSalesData.find(item => item._id === monthNumber);
      return {
        name: month,
        revenue: foundMonth ? foundMonth.revenue : 0 
      };
    });

    res.status(200).json({
      success: true,
      data: {
        stats: { totalRevenue, totalOrders, totalCustomers, avgOrderValue },
        recentOrders,
        topProducts,
        salesData 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};





exports.getManageCustomers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "", status = "" } = req.query;
        const skip = (page - 1) * limit;

 
        let query = { role: "user" }; 
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }
        if (status) query.status = status;

        const customers = await User.find(query)
            .select("-password")
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const customerData = await Promise.all(customers.map(async (user) => {
            const stats = await Order.aggregate([
                { $match: { "customerInfo.email": user.email } },
                { $group: { 
                    _id: null, 
                    totalOrders: { $sum: 1 }, 
                    totalSpent: { $sum: "$totalAmount" },
                    lastActive: { $max: "$createdAt" }
                }}
            ]);

            return {
                ...user._doc,
                ordersCount: stats[0]?.totalOrders || 0,
                totalSpent: stats[0]?.totalSpent || 0,
                lastActive: stats[0]?.lastActive || user.createdAt
            };
        }));

     
        const totalCustomers = await User.countDocuments({ role: "user" });
        const newCustomers = await User.countDocuments({ 
            role: "user", 
            createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) } 
        });
        const inactiveCustomers = await User.countDocuments({ role: "user", status: "inactive" });
        
        const avgOrderValue = await Order.aggregate([
            { $group: { _id: null, avg: { $avg: "$totalAmount" } } }
        ]);

        res.status(200).json({
            success: true,
            data: customerData,
            totalPages: Math.ceil(totalCustomers / limit),
            totalCustomers,
            stats: {
                totalCustomers,
                newCustomers,
                inactiveCustomers,
                avgOrderValue: avgOrderValue[0]?.avg || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // ১. চেক করা যে ইউজার নিজেকে ডিলিট করছে কি না
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own admin account!",
      });
    }

    // ২. ইউজারটি ডাটাবেসে আছে কি না দেখা এবং ডিলিট করা
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error, could not delete user",
    });
  }
};


exports.updateProfile = async (req, res) => {
    try {
        const { userId, role, status } = req.body;

        const updateData = {};
        if (role) updateData.role = role.toLowerCase();
        if (status) updateData.status = status.toLowerCase();  

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { 
                returnDocument: 'after', 
                runValidators: true 
            }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.updateAdminSettings = async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;
        const adminId = req.user._id; 

        const admin = await User.findById(adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }

        const updateData = {};
        if (email) {
            updateData.email = email.toLowerCase();
        }

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: "Current password is required to set a new one" });
            }

            const isMatch = await bcrypt.compare(currentPassword, admin.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Current password is incorrect" });
            }

          
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(newPassword, salt);
        }


        const updatedAdmin = await User.findByIdAndUpdate(
            adminId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Settings updated successfully",
            data: {
                email: updatedAdmin.email,
                name: updatedAdmin.name
            }
        });

    } catch (error) {
        console.error("Settings Update Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};