// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const Razorpay = require("razorpay");

const orderRoutes = require("./routes/orderRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: "*", // You can restrict this later to your frontend domain
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

// ✅ MongoDB Connection (Live MongoDB Atlas)
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected Successfully"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Razorpay Setup (Loads Live Keys from .env)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
app.set("razorpay", razorpay);

// ✅ API Routes
app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Om Sai Backend Running"
  });
});

// ✅ Start Server
// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
