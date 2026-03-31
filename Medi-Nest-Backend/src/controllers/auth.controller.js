const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateToken } = require("../config/jwt");
const { sendEmail, newDoctorApplicationEmail } = require("../config/email");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, specialization, clinicName, clinicAddress, clinicMapLink, phone } = req.body;
    const documents = req.files ? req.files.map((file) => file.path) : [];

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    if (role === "admin") {
      return res.status(403).json({
        message: "Admin accounts cannot be created via registration.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone: role === "doctor" ? phone : undefined,
      specialization: role === "doctor" ? specialization : "",
      clinicName: role === "doctor" ? clinicName : "",
      clinicAddress: role === "doctor" ? clinicAddress : "",
      clinicMapLink: role === "doctor" ? clinicMapLink : "",
      documents: role === "doctor" ? documents : [],
    });

    res.status(201).json({
      message: "User registered",
      userId: user._id,
    });

    // 📧 Notify admin when a doctor registers
    if (role === "doctor" && process.env.ADMIN_EMAIL) {
      try {
        const tmpl = newDoctorApplicationEmail({
          doctorName: user.name,
          doctorEmail: user.email,
          specialization: user.specialization,
        });
        await sendEmail(process.env.ADMIN_EMAIL, tmpl.subject, tmpl.html);
      } catch (emailErr) {
        console.error("Doctor registration email error:", emailErr.message);
      }
    }
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Missing credentials" });

    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(401).json({ message: "Invalid credentials" });

    // 🔥 DOCTOR APPROVAL CHECK (STEP 3)
    if (user.role === "doctor" && !user.isApproved) {
      return res.status(403).json({
        message: "Doctor not approved by admin",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user._id, user.role);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        specialization: user.specialization || "",
        clinicName: user.clinicName || "",
        clinicAddress: user.clinicAddress || "",
        profilePic: user.profilePic || "",
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};