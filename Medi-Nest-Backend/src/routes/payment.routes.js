const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});
console.log("KEY:", process.env.RAZORPAY_KEY);
console.log("SECRET:", process.env.RAZORPAY_SECRET);


// ✅ CREATE ORDER
router.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: 10000, // ₹100
      currency: "INR",
      receipt: "receipt_" + Date.now(), // 🔥 dynamic
    };

    const order = await razorpay.orders.create(options);

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment error" });
  }
});


// ✅ VERIFY PAYMENT (MOST IMPORTANT 🔥)
router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      return res.json({ success: true });
    } else {
      return res.status(400).json({ message: "Invalid payment" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
});

module.exports = router;