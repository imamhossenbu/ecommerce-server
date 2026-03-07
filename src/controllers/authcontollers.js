const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please add all fields" });
    }

    const userExists = await userModel.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    let imageUrl = "";
    if (req.file) {
      imageUrl = req.file.path;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      profileImage: imageUrl,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        ...userResponse,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid User",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Wrong Password",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "Login successfully",
      data: {
        ...userResponse,
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 20;
    const searchKey = req.query.search || "";

    let filter = {};
    if (searchKey) {
      filter.$or = [
        { name: { $regex: searchKey, $options: "i" } },
        { email: { $regex: searchKey, $options: "i" } },
      ];
    }

    const total = await userModel.countDocuments(filter);
    const users = await userModel
      .find(filter)
      .select("-password")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
      pagination: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

const getLoggedUser = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully from server'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};


const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, city, state, zipCode, country } = req.body;
    const userId = req.user._id;

    const updateData = { name, phone, address, city, state, zipCode, country };
    
    if (req.file) {
      updateData.profileImage = req.file.path;
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { 
        returnDocument: 'after', 
        runValidators: true 
      }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // এখানে userModel ব্যবহার করো (তোমার ভ্যারিয়েবল নাম অনুযায়ী)
    const user = await userModel.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found with this email" });
    }

    // ১. টোকেন তৈরি
    const resetToken = crypto.randomBytes(20).toString("hex");

    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; ;

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

 
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      }
    });

    const mailOptions = {
      to: user.email,
      subject: "Password Reset Request - Seoul Mirage",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested to reset your password. Please click the button below:</p>
          <a href="${resetUrl}" style="background: black; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold;">Reset Password</a>
          <p style="color: #666; font-size: 12px;">This link will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: "পাসওয়ার্ড রিসেট লিঙ্ক ইমেইলে পাঠানো হয়েছে!" });
  } catch (error) {
    console.error("Forget Password Error:", error); // কনসোলে এরর চেক করার জন্য
    res.status(500).json({ success: false, message: "ইমেইল পাঠাতে সমস্যা হয়েছে, আবার চেষ্টা করুন।" });
  }
};

const resetPassword = async (req, res) => {
  try {
    // ১. ইউজার থেকে আসা টোকেনটিকে হ্যাশ করা (কারণ ডাটাবেসে হ্যাশ করা টোকেন আছে)
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    // ২. টোকেন ম্যাচ করে এবং মেয়াদ আছে এমন ইউজারকে খোঁজা
    const user = await userModel.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful! You can now login.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getLoggedUser,
  logout,
  updateProfile,
  changePassword,
  forgetPassword,
  resetPassword
};