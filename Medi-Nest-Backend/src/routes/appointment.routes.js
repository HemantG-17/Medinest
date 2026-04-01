const express = require("express");
const router = express.Router();

const Appointment = require("../models/Appointment");
const User = require("../models/User");
const { protect } = require("../middleware/auth.middleware");
const { sendEmail, appointmentConfirmedEmail, consultationCompletedEmail } = require("../config/email");

// 🔥 HELPER: Get Current IST Date/Time
const getIST = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset);
};

// 🔥 HELPER: Parse "10:00 AM" into comparable time
const parseTimeToMinutes = (timeStr) => {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":");
  hours = parseInt(hours);
  minutes = parseInt(minutes);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};


// ✅ CREATE appointment (STRICT + SLOT SAFE)
router.post("/", protect, async (req, res) => {
  try {
    const { doctorId, date, time, paymentDetails } = req.body;

    // 🕒 PAST TIME CHECK
    const istNow = getIST();
    const todayStr = istNow.toISOString().split("T")[0];
    
    if (date < todayStr) {
      return res.status(400).json({ message: "Cannot book appointments in the past date" });
    }
    
    if (date === todayStr) {
      const currentMinutes = istNow.getUTCHours() * 60 + istNow.getUTCMinutes();
      const slotMinutes = parseTimeToMinutes(time);
      if (slotMinutes <= currentMinutes + 5) { // 5 mins buffer
        return res.status(400).json({ message: "This slot has already passed" });
      }
    }

    // 🔥 PATIENT TIME CLASH
    const existing = await Appointment.findOne({
      patientId: req.user.id,
      date,
      time,
    });

    if (existing) {
      return res.status(400).json({
        message: "You already have an appointment at this time",
      });
    }

    // 🔥 DOCTOR SLOT CLASH
    const slotTaken = await Appointment.findOne({
      doctorId,
      date,
      time,
    });

    if (slotTaken) {
      return res.status(400).json({
        message: "This slot is already booked for this doctor",
      });
    }

    // ✅ CREATE
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const appointment = new Appointment({
      patientId: req.user.id,
      doctorId,
      date,
      time,
      status: "Pending",
      otp,
      paymentDetails: paymentDetails || {},
    });

    await appointment.save();

    res.json(appointment);
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: "Error creating appointment" });
  }
});


// ✅ GET my appointments (WITH DOCTOR DATA 🔥)
router.get("/my", protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patientId: req.user.id,
    })
      .populate("doctorId", "name specialization fees") // 🔥 IMPORTANT
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching appointments" });
  }
});


// ❌ DELETE appointment
router.delete("/:id", protect, async (req, res) => {
  try {
    const appt = await Appointment.findOneAndDelete({
      _id: req.params.id,
      patientId: req.user.id,
    });

    if (!appt) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting appointment" });
  }
});


// ❌ CANCEL appointment
router.patch("/:id/cancel", protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.patientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (appointment.status === "Cancelled") {
      return res.status(400).json({ message: "Already cancelled" });
    }

    appointment.status = "Cancelled";

    // ✅ Process Refund
    if (appointment.paymentDetails && appointment.paymentDetails.paymentId) {
      const Razorpay = require("razorpay");
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY,
        key_secret: process.env.RAZORPAY_SECRET,
      });
      try {
        const refund = await razorpay.payments.refund(appointment.paymentDetails.paymentId, { speed: "normal" });
        appointment.paymentDetails.refundId = refund.id;
        appointment.paymentDetails.status = "Refunded";
      } catch (refundErr) {
        console.error("Refund error:", refundErr);
      }
    }

    await appointment.save();

    res.json({ message: "Appointment cancelled", appointment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Cancel failed" });
  }
});


// 🔥 GET available slots (STRICT + DYNAMIC)
router.get("/slots", protect, async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ message: "Doctor ID and Date are required" });
    }

    // 1. Get Doctor's default slots
    const doctor = await User.findById(doctorId).select("availability");
    
    // Default fallback if no slots defined
    let allSlots = ["10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "05:00 PM"];
    
    if (doctor?.availability?.timeSlots && doctor.availability.timeSlots.length > 0) {
      allSlots = doctor.availability.timeSlots;
    }

    // 2. Get Booked appointments for that day
    const booked = await Appointment.find({
      doctorId,
      date,
      status: { $ne: "Cancelled" } // 🔥 Don't count cancelled ones as 'booked'
    });

    const istNow = getIST();
    const todayStr = istNow.toISOString().split("T")[0];
    const currentMinutes = istNow.getUTCHours() * 60 + istNow.getUTCMinutes();

    const bookedTimes = booked.map(appt => appt.time);

    // 3. Mark availability
    const slotStatus = allSlots.map(slot => {
      try {
        let isAvailable = !bookedTimes.includes(slot);
        
        // 🔥 PAST SLOT CHECK
        if (date === todayStr) {
          const slotMinutes = parseTimeToMinutes(slot);
          if (slotMinutes <= currentMinutes + 5) {
            isAvailable = false;
          }
        }

        return {
          time: slot,
          isAvailable
        };
      } catch (slotErr) {
        console.error(`Error parsing slot "${slot}":`, slotErr.message);
        return { time: slot, isAvailable: false };
      }
    });

    res.json(slotStatus);
  } catch (err) {
    console.error("FATAL SLOT ERROR:", err);
    res.status(500).json({ message: "Error fetching slots", error: err.message });
  }
});


// ✅ APPROVE (DOCTOR ACTION)
router.patch("/:id/approve", protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Not found" });
    }

    appointment.status = "Confirmed";
    await appointment.save();

    // 📧 Email patient with confirmation + OTP
    const otp = appointment.otp;
    try {
      const populated = await Appointment.findById(appointment._id)
        .populate("patientId", "name email")
        .populate("doctorId", "name");

      if (populated?.patientId?.email) {
        const tmpl = appointmentConfirmedEmail({
          patientName: populated.patientId.name,
          doctorName: populated.doctorId?.name || "Your Doctor",
          date: appointment.date,
          time: appointment.time,
          otp,
        });
        await sendEmail(populated.patientId.email, tmpl.subject, tmpl.html);
      }
    } catch (emailErr) {
      console.error("Confirm email error:", emailErr.message);
    }

    res.json({ message: "Approved", appointment });
  } catch (err) {
    res.status(500).json({ message: "Error approving" });
  }
});


// ❌ REJECT
router.patch("/:id/reject", protect, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Not found" });
    }

    appointment.status = "Rejected";
    if (rejectionReason) appointment.rejectionReason = rejectionReason;

    // ✅ Process Refund
    if (appointment.paymentDetails && appointment.paymentDetails.paymentId) {
      const Razorpay = require("razorpay");
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY,
        key_secret: process.env.RAZORPAY_SECRET,
      });
      try {
        const refund = await razorpay.payments.refund(appointment.paymentDetails.paymentId, { speed: "normal" });
        appointment.paymentDetails.refundId = refund.id;
        appointment.paymentDetails.status = "Refunded";
      } catch (refundErr) {
        console.error("Refund error:", refundErr);
      }
    }

    await appointment.save();

    res.json({ message: "Rejected", appointment });
  } catch (err) {
    res.status(500).json({ message: "Error rejecting" });
  }
});


// ✅ VERIFY OTP
router.patch("/:id/verify-otp", protect, async (req, res) => {
  try {
    const { otp } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    if (appointment.doctorId.toString() !== req.user.id) {
       return res.status(403).json({ message: "Unauthorized" });
    }

    if (appointment.status !== "Confirmed") {
       return res.status(400).json({ message: "Appointment is not confirmed" });
    }

    if (appointment.otp !== otp) {
       return res.status(400).json({ message: "Invalid OTP" });
    }

    appointment.status = "Completed";
    await appointment.save();

    // 📧 Email patient: consultation done + review request
    try {
      const populated = await Appointment.findById(appointment._id)
        .populate("patientId", "name email")
        .populate("doctorId", "name");

      if (populated?.patientId?.email) {
        const tmpl = consultationCompletedEmail({
          patientName: populated.patientId.name,
          doctorName: populated.doctorId?.name || "Your Doctor",
          date: appointment.date,
          time: appointment.time,
        });
        await sendEmail(populated.patientId.email, tmpl.subject, tmpl.html);
      }
    } catch (emailErr) {
      console.error("Completion email error:", emailErr.message);
    }

    res.json({ message: "OTP Verified, Visit Completed", appointment });
  } catch(err) {
    res.status(500).json({ message: "Error verifying OTP" });
  }
});

// 👨‍⚕️ DOCTOR APPOINTMENTS
router.get("/doctor", protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      doctorId: req.user.id,
    })
      .populate("patientId", "name email")
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Error fetching doctor appointments" });
  }
});


module.exports = router;