// 📩 emailService.js
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

// ==========================
// 🔐 Load & Validate API Key
// ==========================
if (!process.env.SENDGRID_API_KEY) {
  console.error("❌ Missing SENDGRID_API_KEY in environment variables");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("✅ SendGrid API Key Loaded");
}

if (!process.env.SENDGRID_FROM_EMAIL) {
  console.error("❌ Missing SENDGRID_FROM_EMAIL");
}

// ==========================
// 🎨 Email Templates
// ==========================
export const templates = {
  otp: (otp) => `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
      <h2 style="color: #0b58bc;">Your OTP Code</h2>
      <p>Use the code below to verify your account:</p>
      <h1 style="letter-spacing: 4px; color:#0b58bc;">${otp}</h1>
      <p style="font-size: 13px; color: #888;">This code expires in 5 minutes.</p>
    </div>
  `,

  resetPassword: (resetUrl) => `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
      <h2 style="color: #0b58bc;">Reset Your Password</h2>
      <p>Click the button below to set a new password:</p>
      <a href="${resetUrl}" 
         style="display:inline-block;background:#0b58bc;color:#fff;
                padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:10px;">
        Reset Password
      </a>
      <p style="font-size: 13px; color: #888; margin-top:15px;">
        If you didn’t request this, ignore this email.
      </p>
    </div>
  `,

  newsletter: (content) => `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
      ${content}
      <hr />
      <p style="font-size: 12px; color: #888;">
        SILVLIGHT PRODUCT © ${new Date().getFullYear()}
      </p>
    </div>
  `,
};

// ==========================
// 🚀 Base Send Email Function
// ==========================
export const sendEmail = async (to, subject, htmlContent) => {
  try {
    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: "SILVLIGHT PRODUCT",
      },
      subject,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`📨 Email sent successfully to ${to}`);
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);

    if (error.response?.body?.errors) {
      console.error(
        "SendGrid API Errors:",
        JSON.stringify(error.response.body.errors, null, 2)
      );
    }

    if (error.code) {
      console.error("SendGrid Error Code:", error.code);
    }

    throw new Error("Fail to send email");
   }
};

// ==========================
// 📮 Specific Email Functions
// ==========================
export const sendOtpEmail = async (email, otp) => {
  return sendEmail(email, "Your OTP Code", templates.otp(otp));
};

export const sendPasswordResetEmail = async (email, resetUrl) => {
  return sendEmail(email, "Password Reset Request", templates.resetPassword(resetUrl));
};

export const sendNewsletterEmail = async (recipients, subject, content) => {
  return sendEmail(recipients, subject, templates.newsletter(content));
};
