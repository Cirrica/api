const express = require('express');
const router = express.Router();
const {
  sendOtpEmail,
  verifyOtpEmail,
} = require('../controllers/emailController');

router.post('/send-otp', sendOtpEmail);
router.post('/verify-otp', verifyOtpEmail);

module.exports = router;
