const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool, sql } = require("../config/dbconfig");
const { saveOtp, getOtp, deleteOtp } = require("../models/otpmodels");
const transporter = require("../config/Mailer");

// Step 1: Validate password → send OTP
exports.sendOtpAfterPassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    // Lookup user
    const result = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM users WHERE email = @email");

    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    saveOtp(email, otp, expiresAt);

    // Send OTP via Brevo API
    await sendEmail({
      to: email,
      subject: "Your OTP Code - Login Verification",
      text: `Your OTP code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Login Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="background-color: #f4f4f4; padding: 20px; text-align: center; letter-spacing: 5px; color: #4CAF50;">
            ${otp}
          </h1>
          <p style="color: #666;">This code will expire in <strong>5 minutes</strong>.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    console.log(`✅ OTP sent successfully to ${email}`);
    res.json({
      message: "OTP sent to your email",
      email: email,
    });
  } catch (err) {
    console.error("❌ Error in sendOtpAfterPassword:", err);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

// Step 2: Verify OTP → generate JWT (remains the same)
exports.verifyOtpAndLogin = async (req, res) => {
  const { email, otp } = req.body;

  console.log("📨 Received OTP verification request:", {
    email,
    otpLength: otp?.length,
  });

  if (!email || !otp) {
    console.log("❌ Missing email or OTP");
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const data = getOtp(email);

  if (!data) {
    console.log("❌ OTP not found for email:", email);
    return res.status(400).json({
      message: "OTP not found or expired. Please request a new OTP",
    });
  }

  if (Date.now() > data.expiresAt) {
    console.log("⏰ OTP expired for email:", email);
    deleteOtp(email);
    return res.status(400).json({
      message: "OTP expired. Please request a new OTP",
    });
  }

  const receivedOtp = String(otp).trim();
  const storedOtp = String(data.otp).trim();

  if (receivedOtp !== storedOtp) {
    console.log("❌ Invalid OTP provided");
    return res.status(400).json({ message: "Invalid OTP. Please try again" });
  }

  console.log("✅ OTP verified successfully");
  deleteOtp(email);

  try {
    const result = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT id, name, email, role FROM users WHERE email = @email");

    if (result.recordset.length === 0) {
      console.log("❌ User not found after OTP verification");
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.recordset[0];

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    console.log("🎉 Login successful for user:", email);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Database error during OTP verification:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};
