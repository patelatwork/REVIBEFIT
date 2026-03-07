import config from "../config/index.js";

/**
 * Send an SMS message via MSG91 or log it in development.
 *
 * @param {string} phone - 10-digit phone number
 * @param {string} message - SMS body (max ~160 chars for single SMS)
 * @returns {Promise<Object>}
 */
export const sendSms = async (phone, message) => {
  if (!config.sms.apiKey) {
    if (!config.isProduction) {
      console.log(`[SMS-DEV] To: ${phone} | Message: ${message}`);
      return { success: true, skipped: true, message: "SMS not configured, logged to console" };
    }
    throw new Error("SMS API key not configured");
  }

  try {
    // MSG91 API integration
    const response = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: config.sms.apiKey,
      },
      body: JSON.stringify({
        sender: config.sms.senderId,
        route: "4", // Transactional
        country: "91",
        sms: [
          {
            message,
            to: [phone],
          },
        ],
      }),
    });

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("SMS send failed:", error.message);
    return { success: false, error: error.message };
  }
};

export default { sendSms };
