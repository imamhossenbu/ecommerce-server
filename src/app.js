const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const imageUploadRoutes = require("./routes/imageupuloadRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
const whitelist = [
  'https://ecommerce-with-react-3ljc.vercel.app',
  'https://ecommerce-frontend-amber-eight.vercel.app',
  'https://ecommerce-with-next-drab.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/hello", (req, res) => {
  res.send("hello world");
});

app.use("/api/auth", authRoutes);
app.use("/api", imageUploadRoutes);
app.use("/api", categoryRoutes);
app.use("/api", productRoutes);
app.use("/api/payment", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use('/api/admin', adminRoutes);

module.exports = app;
