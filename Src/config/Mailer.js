const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const brevo = require("@getbrevo/brevo");

// Initialize Brevo API client
let apiInstance = new brevo.TransactionalEmailsApi();
let apiKey = apiInstance.authentications["apiKey"];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Create transporter-like object to match nodemailer interface
const transporter = {
  sendMail: async ({ from, to, subject, text, html }) => {
    let sendSmtpEmail = new brevo.SendSmtpEmail();

    // Parse sender name and email from "Name <email>" format
    let senderName = "OTP Service";
    let senderEmail = process.env.EMAIL_USER;

    if (from) {
      const match = from.match(/^"?([^"<]+)"?\s*<([^>]+)>$/);
      if (match) {
        senderName = match[1].trim();
        senderEmail = match[2].trim();
      } else {
        senderEmail = from;
      }
    }

    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent =
      html || `<html><body><p>${text}</p></body></html>`;
    sendSmtpEmail.sender = {
      name: senderName,
      email: senderEmail,
    };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.textContent = text;

    try {
      const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log("✅ Email sent successfully via Brevo API");
      return {
        messageId: data.messageId,
        accepted: [to],
        response: "250 OK",
      };
    } catch (error) {
      console.error("❌ Brevo API Error:", error);
      throw error;
    }
  },

  verify: async function () {
    try {
      const accountApi = new brevo.AccountApi();
      accountApi.authentications["apiKey"].apiKey = process.env.BREVO_API_KEY;
      await accountApi.getAccount();
      console.log("✅ Brevo API connection verified");
      return true;
    } catch (error) {
      console.error("❌ Brevo API verification failed:", error.message);
      throw error;
    }
  },
};

// Verify on startup
transporter.verify().catch((err) => {
  console.error("Warning: Could not verify Brevo API connection");
});

module.exports = transporter;
