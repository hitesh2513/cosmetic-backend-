// backend/routes/orderRoutes.js
const express = require("express");
const Razorpay = require("razorpay");
const Order = require('./../models/order');
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
router.post("/", async (req, res) => {
  const { name, email, mobile, address, pincode, items } = req.body;

  if (!name || !email || !mobile || !address || !pincode || !items || items.length === 0) {
    return res.status(400).json({ error: "Missing fields or empty cart" });
  }

  try {
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0) * 100;

    const razorpayOrder = await razorpay.orders.create({
      amount: total,
      currency: "INR",
      receipt: "rcpt_" + Date.now()
    });

    const newOrder = new Order({
      name,
      email,
      mobile,
      address,
      pincode,
      items,
      razorpayOrderId: razorpayOrder.id
    });

    await newOrder.save();

    res.json({
      orderId: razorpayOrder.id,
      amount: total,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error("Razorpay Error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Confirm payment
router.post("/confirm", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id } = req.body;
  try {
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.paymentStatus = "Paid";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    res.json({ message: "Payment confirmed" });
  } catch (err) {
    console.error("Payment confirm error:", err);
    res.status(500).json({ error: "Failed to confirm payment" });
  }
});

// Get user orders
router.get("/user/:email", async (req, res) => {
  try {
    const orders = await Order.find({ email: req.params.email }).sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to get user orders" });
  }
});

// ✅ Update delivery or payment status (Admin)
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const order = await Order.findByIdAndUpdate(id, updates, { new: true });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order updated successfully", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Export the router
module.exports = router;