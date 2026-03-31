const express = require("express");
const router = express.Router();

const User = require("../models/User");
const { protect } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware"); // 🔥 FIX

// ✅ GET MY PROFILE (DOCTOR)
router.get("/me", protect, async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id).select("-password");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// 🔥 UPDATE PROFILE (DOCTOR ONLY) — supports clinic info + document uploads
router.patch("/profile", protect, upload.array("documents", 5), async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Doctor only" });
    }

    const { specialization, fees, availability, clinicAddress, clinicMapLink } = req.body;

    const updateFields = {};

    if (specialization !== undefined) updateFields.specialization = specialization;
    if (fees !== undefined) updateFields.fees = Number(fees);
    if (clinicAddress !== undefined) updateFields.clinicAddress = clinicAddress;
    if (clinicMapLink !== undefined) updateFields.clinicMapLink = clinicMapLink;

    // availability is sent as { workingDays: [], timeSlots: [], holidays: [] }
    if (availability) {
      const parsed = typeof availability === "string" ? JSON.parse(availability) : availability;
      if (parsed.workingDays) updateFields["availability.workingDays"] = parsed.workingDays;
      if (parsed.timeSlots)   updateFields["availability.timeSlots"]   = parsed.timeSlots;
      if (parsed.holidays)    updateFields["availability.holidays"]    = parsed.holidays;
    }

    // New uploaded documents — push to existing list
    if (req.files && req.files.length > 0) {
      const newDocs = req.files.map(f => f.path);
      const doctor = await User.findById(req.user.id);
      updateFields.documents = [...(doctor.documents || []), ...newDocs];
    }

    const doctor = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, select: "-password" }
    );

    res.json({ message: "Profile updated", doctor });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Error updating profile" });
  }
});



// 🔥 GET APPROVED DOCTORS (PUBLIC)
router.get("/list", async (req, res) => {
  try {
    const { city } = req.query;

    let filter = {
      role: "doctor",
      isApproved: true,
    };

    // 🔥 CITY FILTER
    if (city) {
      filter.city = city;
    }

    const doctors = await User.find(filter).select("-password");

    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: "Error fetching doctors" });
  }
});


// 🔥 APPLY AS DOCTOR (WITH FILE UPLOAD)
router.post(
  "/apply",
  protect,
  upload.fields([
    { name: "profilePic", maxCount: 1 }, // 🔥 NEW
    { name: "documents", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const {
        specialization,
        fees,
        phone,
        clinicAddress,
        clinicMapLink,
        city, // 🔥 ADD
      } = req.body;

      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // 🔥 PROFILE PIC
      const profilePic = req.files["profilePic"]
        ? req.files["profilePic"][0].path
        : user.profilePic;

      // 🔥 DOCUMENTS
      const documents = req.files["documents"]
        ? req.files["documents"].map((file) => file.path)
        : [];

      // 🔥 UPDATE USER
      user.role = "doctor";
      user.specialization = specialization;
      user.fees = fees;
      user.phone = phone;
      user.clinicAddress = clinicAddress;
      user.clinicMapLink = clinicMapLink;
      user.profilePic = profilePic;
      user.documents = documents;
      user.city=city;

      user.isApproved = false; // 🔥 CRITICAL

      await user.save();

      res.json({
        message: "Application submitted for approval",
        user,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error applying" });
    }
  }
);
router.get("/:id", async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id).select("-password");

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: "Error fetching doctor" });
  }
});

module.exports = router;