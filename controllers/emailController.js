const transporter = require('../config/email');
const loadOtpTemplate = require('../emailTemplates/otp');

// In-memory store for OTPs (use Redis or DB in production)
const otpStore = {};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000);
}

exports.sendOtpEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const otpCode = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore[email] = { code: otpCode, expiresAt };

  const htmlContent = loadOtpTemplate(otpCode);
  try {
    await transporter.sendMail({
      from: 'No-Reply <noreply@cirrica.com>',
      to: email,
      subject: 'One-Time Code - Cirrica Capital',
      text: `Here is your one-time code: ${otpCode}`,
      html: htmlContent,
    });
    res.json({ message: 'OTP sent' }).status(200);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

exports.verifyOtpEmail = (req, res) => {
  const { email, code } = req.body;
  const record = otpStore[email];
  if (!record) return res.status(400).json({ error: 'No OTP requested' });
  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ error: 'OTP expired' });
  }
  if (parseInt(code, 10) !== record.code) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
  delete otpStore[email];
  res.json({ message: 'OTP verified' });
};
