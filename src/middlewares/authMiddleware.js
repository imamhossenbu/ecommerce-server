const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  console.log("Token detected in Header:", token ? "Yes" : "No");

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
    console.error("JWT Error:", error.message);
    return res.status(401).json({ message: "Token is not valid or expired" });
  }
};

module.exports = { protect };