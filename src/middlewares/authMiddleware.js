const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const userModel = require("../models/user.model");

const protect = async (req, res, next) => {
  let token = req.cookies.token;

  console.log("Cookies received:", req.cookies);


  if (!token) {
    return res.status(401).json({ message: "Not authorized, please login" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await userModel.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = { protect };
