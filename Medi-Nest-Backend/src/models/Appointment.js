const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    // 👤 PATIENT
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 👨‍⚕️ DOCTOR (🔥 FIXED)
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 📅 DATE & TIME
    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    // 🔥 STATUS FLOW
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Rejected", "Cancelled", "Completed"],
      default: "Pending",
    },

    // 🔒 VERIFICATION
    otp: {
      type: String,
      default: "",
    },

    // ❌ REJECTION
    rejectionReason: {
      type: String,
      default: "",
    },

    // 💳 PAYMENT
    paymentDetails: {
      orderId: String,
      paymentId: String,
      refundId: String,
      status: {
        type: String,
        enum: ["Pending", "Successful", "Refunded"],
        default: "Pending",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);