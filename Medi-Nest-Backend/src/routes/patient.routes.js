const express = require("express");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/dashboard", protect, (req, res) => {
  if (req.user.role !== "patient") {
    return res.status(403).json({ message: "Forbidden" });
  }

  res.json({
    message: "Patient dashboard data",
    patients: [],
  });
});

module.exports = router;
