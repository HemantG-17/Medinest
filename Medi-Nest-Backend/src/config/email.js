const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use Gmail App Password (not your real password)
  },
});

/**
 * Send a styled HTML email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 */
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Medinest Healthcare" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to: ${to}`);
  } catch (err) {
    console.error("❌ Email failed:", err.message);
    // Don't throw — email failure shouldn't break the API
  }
};

// ─── EMAIL TEMPLATES ────────────────────────────────────────────────────────

/**
 * 1. Patient: Appointment confirmed email (with OTP)
 */
const appointmentConfirmedEmail = ({ patientName, doctorName, date, time, otp }) => ({
  subject: "✅ Your Appointment is Confirmed — Medinest",
  html: `
    <div style="font-family: 'Helvetica Neue', sans-serif; background:#f4f7f6; padding:30px;">
      <div style="max-width:560px; margin:auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <div style="background:#0eb5b5; padding:28px 32px; text-align:center;">
          <h1 style="color:#fff; margin:0; font-size:24px;">Appointment Confirmed!</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#374151; font-size:15px;">Hi <strong>${patientName}</strong>,</p>
          <p style="color:#374151; font-size:15px;">Your appointment has been <strong style="color:#0eb5b5;">confirmed</strong> by the doctor.</p>

          <div style="background:#f0fafa; border-radius:12px; padding:20px; margin:20px 0; border-left:4px solid #0eb5b5;">
            <p style="margin:6px 0; color:#374151;"><strong>Doctor:</strong> ${doctorName}</p>
            <p style="margin:6px 0; color:#374151;"><strong>Date:</strong> ${date}</p>
            <p style="margin:6px 0; color:#374151;"><strong>Time:</strong> ${time}</p>
          </div>

          <div style="background:#fff8e1; border-radius:12px; padding:20px; margin:20px 0; border-left:4px solid #f59e0b; text-align:center;">
            <p style="margin:0 0 8px; color:#374151; font-size:13px;">Your Visit OTP (share with doctor only)</p>
            <h2 style="margin:0; font-size:42px; letter-spacing:10px; color:#f59e0b;">${otp}</h2>
            <p style="margin:8px 0 0; color:#9ca3af; font-size:12px;">Show this OTP to the doctor at the start of your visit</p>
          </div>

          <p style="color:#9ca3af; font-size:12px; text-align:center; margin-top:24px;">
            © 2024 Medinest Healthcare. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `,
});

/**
 * 2. Admin: New doctor application email
 */
const newDoctorApplicationEmail = ({ doctorName, doctorEmail, specialization }) => ({
  subject: "🩺 New Doctor Application — Medinest Admin",
  html: `
    <div style="font-family: 'Helvetica Neue', sans-serif; background:#f4f7f6; padding:30px;">
      <div style="max-width:560px; margin:auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <div style="background:#1f2937; padding:28px 32px; text-align:center;">
          <h1 style="color:#fff; margin:0; font-size:22px;">New Doctor Application</h1>
          <p style="color:#9ca3af; margin:6px 0 0; font-size:13px;">Action required</p>
        </div>
        <div style="padding:32px;">
          <p style="color:#374151; font-size:15px;">A new doctor has registered and is waiting for your approval:</p>

          <div style="background:#f9fafb; border-radius:12px; padding:20px; margin:20px 0; border:1px solid #e5e7eb;">
            <p style="margin:6px 0; color:#374151;"><strong>Name:</strong> ${doctorName}</p>
            <p style="margin:6px 0; color:#374151;"><strong>Email:</strong> ${doctorEmail}</p>
            <p style="margin:6px 0; color:#374151;"><strong>Specialization:</strong> ${specialization || "Not specified"}</p>
          </div>

          <p style="color:#374151; font-size:14px;">Please log in to the <strong>Medinest Admin Panel</strong> to review the doctor's submitted documents and approve or reject the application.</p>

          <p style="color:#9ca3af; font-size:12px; text-align:center; margin-top:24px;">
            © 2024 Medinest Healthcare. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `,
});

/**
 * 3a. Doctor: Approved email
 */
const doctorApprovedEmail = ({ doctorName }) => ({
  subject: "🎉 Your Medinest Application is Approved!",
  html: `
    <div style="font-family: 'Helvetica Neue', sans-serif; background:#f4f7f6; padding:30px;">
      <div style="max-width:560px; margin:auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <div style="background:#0eb5b5; padding:28px 32px; text-align:center;">
          <h1 style="color:#fff; margin:0; font-size:24px;">You're Approved! 🎉</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#374151; font-size:15px;">Hi <strong>Dr. ${doctorName}</strong>,</p>
          <p style="color:#374151; font-size:15px;">Congratulations! Your application on <strong>Medinest</strong> has been <strong style="color:#16a34a;">approved</strong> by our admin team.</p>
          <p style="color:#374151; font-size:15px;">You can now <strong>log in</strong> to your Doctor Dashboard and start accepting patient appointments.</p>

          <div style="background:#dcfce7; border-radius:12px; padding:16px; margin:20px 0; border-left:4px solid #16a34a;">
            <p style="margin:0; color:#16a34a; font-weight:600;">✅ Your account is now active</p>
          </div>

          <p style="color:#9ca3af; font-size:12px; text-align:center; margin-top:24px;">
            © 2024 Medinest Healthcare. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `,
});

/**
 * 3b. Doctor: Rejected email
 */
const doctorRejectedEmail = ({ doctorName }) => ({
  subject: "❌ Your Medinest Application was not Approved",
  html: `
    <div style="font-family: 'Helvetica Neue', sans-serif; background:#f4f7f6; padding:30px;">
      <div style="max-width:560px; margin:auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <div style="background:#1f2937; padding:28px 32px; text-align:center;">
          <h1 style="color:#fff; margin:0; font-size:22px;">Application Status Update</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#374151; font-size:15px;">Hi <strong>Dr. ${doctorName}</strong>,</p>
          <p style="color:#374151; font-size:15px;">After reviewing your application and submitted documents, our admin team was unable to approve your registration at this time.</p>

          <div style="background:#fee2e2; border-radius:12px; padding:16px; margin:20px 0; border-left:4px solid #dc2626;">
            <p style="margin:0; color:#dc2626; font-weight:600;">❌ Application not approved</p>
          </div>

          <p style="color:#374151; font-size:14px;">If you believe this was a mistake or would like to reapply with updated documents, please contact us at <a href="mailto:support@medinest.com" style="color:#0eb5b5;">support@medinest.com</a>.</p>

          <p style="color:#9ca3af; font-size:12px; text-align:center; margin-top:24px;">
            © 2024 Medinest Healthcare. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `,
});

/**
 * 4. Patient: Consultation completed + review request
 */
const consultationCompletedEmail = ({ patientName, doctorName, date, time }) => ({
  subject: "🎉 Consultation Complete — Please Review Your Doctor",
  html: `
    <div style="font-family: 'Helvetica Neue', sans-serif; background:#f4f7f6; padding:30px;">
      <div style="max-width:560px; margin:auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <div style="background:#0eb5b5; padding:28px 32px; text-align:center;">
          <h1 style="color:#fff; margin:0; font-size:24px;">Consultation Completed! 🎉</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#374151; font-size:15px;">Hi <strong>${patientName}</strong>,</p>
          <p style="color:#374151; font-size:15px;">Your consultation with <strong>${doctorName}</strong> has been successfully completed. We hope you had a great experience!</p>

          <div style="background:#f0fafa; border-radius:12px; padding:20px; margin:20px 0; border-left:4px solid #0eb5b5;">
            <p style="margin:6px 0; color:#374151;"><strong>Doctor:</strong> ${doctorName}</p>
            <p style="margin:6px 0; color:#374151;"><strong>Date:</strong> ${date}</p>
            <p style="margin:6px 0; color:#374151;"><strong>Time:</strong> ${time}</p>
            <p style="margin:6px 0; color:#22c55e; font-weight:600;">✅ Status: Completed</p>
          </div>

          <div style="background:#f9fafb; border-radius:12px; padding:20px; margin:20px 0; text-align:center; border:1px solid #e5e7eb;">
            <p style="margin:0 0 6px; color:#374151; font-size:15px; font-weight:700;">⭐ How was your experience?</p>
            <p style="margin:0 0 16px; color:#6b7280; font-size:13px;">Your feedback helps other patients find the right doctor</p>
            <div style="display:flex; justify-content:center; gap:4px; font-size:28px; letter-spacing:4px;">⭐⭐⭐⭐⭐</div>
            <p style="margin:16px 0 0; color:#9ca3af; font-size:12px;">Open the Medinest app under <strong>My Appointments</strong> to leave a review</p>
          </div>

          <p style="color:#374151; font-size:14px;">Thank you for choosing <strong>Medinest</strong> for your healthcare needs. We look forward to serving you again!</p>

          <p style="color:#9ca3af; font-size:12px; text-align:center; margin-top:24px;">
            © 2024 Medinest Healthcare. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `,
});

module.exports = {
  sendEmail,
  appointmentConfirmedEmail,
  newDoctorApplicationEmail,
  doctorApprovedEmail,
  doctorRejectedEmail,
  consultationCompletedEmail,
};
