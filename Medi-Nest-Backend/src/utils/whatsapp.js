const twilio = require("twilio");

let client;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
} else {
  console.warn("⚠️ TWILIO credentials missing. WhatsApp notifications will be skipped.");
}

/**
 * Send a WhatsApp message
 * @param {string} to - Recipient phone number (e.g. +91XXXXXXXXXX)
 * @param {string} message - Message body
 */
const sendWhatsApp = async (to, message) => {
  if (!client) return;

  try {
    const from = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"; // Default Sandbox number
    
    // Twilio WhatsApp numbers MUST be prefixed with 'whatsapp:'
    const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    const response = await client.messages.create({
      body: message,
      from: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
      to: formattedTo,
    });

    console.log(`✅ WhatsApp sent to ${to}: CID ${response.sid}`);
    return response;
  } catch (err) {
    console.error(`❌ WhatsApp Error to ${to}:`, err.message);
  }
};

module.exports = { sendWhatsApp };
