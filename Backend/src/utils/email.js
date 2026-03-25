import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

console.log("[email] SMTP_USER loaded:", process.env.SMTP_USER);

export const sendVerificationEmail = async (to, token) => {
  const apiBase = process.env.API_URL || "http://localhost:5001";
  const verifyUrl = `${apiBase}/api/auth/verify/${token}`;
  const html = `
    <h2>Verify your email</h2>
    <p>Click the link below to verify your account:</p>
    <a href="${verifyUrl}">Verify Email</a>
  `;

  try {
    console.log("[email] Sending verification to:", to);
    console.log("[email] Verify URL:", verifyUrl);
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "no-reply@secureshare.app",
      to,
      subject: "Verify your email",
      html
    });
    console.log("[email] sendMail completed");
  } catch (err) {
    console.error("[email] Failed to send verification email:", err);
  }
};
