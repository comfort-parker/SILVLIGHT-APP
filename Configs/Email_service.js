// 📩 emailService.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// 🧭 Debug: Confirm environment variables are loaded
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "✅ Loaded" : "❌ Not Loaded");

// ✅ 1. Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, 
  },
});

// ✅ 2. Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email transporter is ready to send messages");
  }
});

// ✅ 3. Send OTP Email
export const sendOtpEmail = async (toEmail, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"SILVLIGHT PRODUCT" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: "Your OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f2f2f2;">
          <h2 style="color: #007BFF;">Your OTP</h2>
          <p>Use the code below to verify your account:</p>
          <h1 style="letter-spacing: 3px;">${otp}</h1>
          <p style="font-size: 14px; color: #777;">This OTP will expire in 5 minutes.</p>
        </div>
      `,
    });

    console.log("✅ OTP email sent successfully!");
    console.log("📨 Message ID:", info.messageId);
    console.log("📬 Full response:", info);
  } catch (error) {
    console.error("❌ Failed to send OTP email:", error);
  }
};

// ✅ 4. Send Password Reset Email
export const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  try {
    const info = await transporter.sendMail({
      from: `"SILVLIGHT PRODUCT" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f2f2f2;">
          <h2 style="color: #007BFF;">Reset Your Password</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="color: #007BFF;">Reset Password</a>
          <p style="font-size: 14px; color: #777;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    console.log("✅ Password reset email sent successfully!");
    console.log("📨 Message ID:", info.messageId);
    console.log("📬 Full response:", info);
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error);
  }
};

// ✅ 5. Send Newsletter Email
export const sendNewsletterEmail = async (recipients, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: `"SILVLIGHT PRODUCT" <${process.env.SMTP_USER}>`,
      to: recipients.join(","),
      subject,
      html: htmlContent,
    });

    console.log("✅ Newsletter email sent to:", recipients);
    console.log("📨 Message ID:", info.messageId);
    console.log("📬 Full response:", info);
  } catch (error) {
    console.error("❌ Failed to send newsletter email:", error);
  }
};
