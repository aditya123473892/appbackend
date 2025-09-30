const express = require("express");
const router = express.Router();
const authController = require("../controller/authcontroller");
const otpController = require("../controller/otpcontroller");

router.post("/signup", authController.signup);

// Direct email/password login
router.post("/login", authController.login); // Direct login without OTP

// OTP-based login with password (still available if needed)
// router.post("/request-otp", otpController.sendOtpAfterPassword); // Step 1
// router.post("/verify-otp", otpController.verifyOtpAndLogin);     // Step 2

module.exports = router;
