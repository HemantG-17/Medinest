const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    specialization: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      required: function () {
        return this.role === "doctor";
      },
    },

    profilePic: {
      type: String,
      default: "https://via.placeholder.com/150",
    },

    clinicName: String,
    clinicAddress: String,
    clinicMapLink: String,

    documents: {
      type: [String],
      default: [],
      validate: {
        validator: function (val) {
          if (this.role === "doctor") return val.length > 0;
          return true;
        },
        message: "Doctor must upload documents",
      },
    },

    fees: {
      type: Number,
      default: 0,
    },

    availability: {
      workingDays: { type: [String], default: [] },
      timeSlots: { type: [String], default: [] },
      lunchBreak: {
        start: { type: String, default: "" },
        end: { type: String, default: "" },
      },
      holidays: { type: [String], default: [] },
    },

    city: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// 🔥 PERFORMANCE INDEX
userSchema.index({ role: 1, isApproved: 1 });

module.exports = mongoose.model("User", userSchema);