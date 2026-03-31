const express = require("express");
const router = express.Router();
const { chatWithAI, getUnrecognized, teachAI } = require("../controllers/aiController");
const { protect } = require("../middleware/auth.middleware");

// 🔥 ADMIN ONLY MIDDLEWARE
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

router.post("/chat", chatWithAI);

// ✅ ADMIN ROUTES
router.get("/unrecognized", protect, adminOnly, getUnrecognized);
router.post("/teach", protect, adminOnly, teachAI);

module.exports = router;