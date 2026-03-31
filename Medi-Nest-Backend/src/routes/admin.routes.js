const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth.middleware");
const { sendEmail, doctorApprovedEmail, doctorRejectedEmail } = require("../config/email");
const UnrecognizedQuery = require("../models/UnrecognizedQuery");

// 🔥 ADMIN ONLY MIDDLEWARE (INLINE SAFE)
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access only",
    });
  }
  next();
};

// 🔥 GET ALL DOCTORS (ONLY ADMIN)
router.get("/doctors", protect, adminOnly, async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: "Error fetching doctors" });
  }
});

// 📊 GET DASHBOARD STATS (ONLY ADMIN)
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const totalDoctors = await User.countDocuments({ role: "doctor" });
    const approvedDoctors = await User.countDocuments({ role: "doctor", isApproved: true });
    const pendingDoctors = await User.countDocuments({ role: "doctor", isApproved: false });
    const totalPatients = await User.countDocuments({ role: "patient" });
    const unrecognizedCount = await UnrecognizedQuery.countDocuments({ isResolved: false });

    res.json({
      totalDoctors,
      approvedDoctors,
      pendingDoctors,
      totalPatients,
      unrecognizedCount
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats" });
  }
});

// ✅ APPROVE DOCTOR (ONLY ADMIN)
router.patch("/approve/:id", protect, adminOnly, async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isApproved = true;
    await doctor.save();

    // 📧 Email doctor that they're approved
    try {
      const tmpl = doctorApprovedEmail({ doctorName: doctor.name });
      await sendEmail(doctor.email, tmpl.subject, tmpl.html);
    } catch (emailErr) {
      console.error("Approval email error:", emailErr.message);
    }

    res.json({ message: "Doctor approved" });
  } catch (err) {
    res.status(500).json({ message: "Error approving doctor" });
  }
});

// ❌ REJECT DOCTOR (ONLY ADMIN)
router.delete("/reject/:id", protect, adminOnly, async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // 📧 Email doctor that they're rejected (before deleting)
    try {
      const tmpl = doctorRejectedEmail({ doctorName: doctor.name });
      await sendEmail(doctor.email, tmpl.subject, tmpl.html);
    } catch (emailErr) {
      console.error("Rejection email error:", emailErr.message);
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "Doctor rejected" });
  } catch (err) {
    res.status(500).json({ message: "Error rejecting doctor" });
  }
});

module.exports = router;