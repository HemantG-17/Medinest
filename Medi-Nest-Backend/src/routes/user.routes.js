const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const User = require("../models/User");
const { protect } = require("../middleware/auth.middleware");

// ☁️ CLOUDINARY STORAGE CONFIG
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "medinest/profiles",
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const upload = multer({ storage: storage });

// 🔥 UPDATE PROFILE PIC
router.patch("/profile-pic", protect, upload.single("profilePic"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: req.file.path },
      { new: true }
    );

    res.json({
      message: "Profile picture updated",
      profilePic: user.profilePic,
    });
  } catch (err) {
    console.error("PROFILE PIC UPLOAD ERROR:", err);
    res.status(500).json({ message: "Server error during upload" });
  }
});

module.exports = router;
