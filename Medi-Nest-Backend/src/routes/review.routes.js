const express = require("express");
const router = express.Router();

const Review = require("../models/Review");
const { protect } = require("../middleware/auth.middleware");

// ✅ ADD REVIEW
router.post("/", protect, async (req, res) => {
  try {
    const { doctorId, rating, comment } = req.body;

    // ❌ prevent duplicate review
    const existing = await Review.findOne({
      doctorId,
      patientId: req.user.id,
    });

    if (existing) {
      return res.status(400).json({
        message: "You already reviewed this doctor",
      });
    }

    const review = await Review.create({
      doctorId,
      patientId: req.user.id,
      rating,
      comment,
    });

    res.json(review);
  } catch (err) {
    res.status(500).json({ message: "Error adding review" });
  }
});

// ✅ GET REVIEWS BY DOCTOR
router.get("/:doctorId", async (req, res) => {
  try {
    const reviews = await Review.find({
      doctorId: req.params.doctorId,
    }).populate("patientId", "name");

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

module.exports = router;