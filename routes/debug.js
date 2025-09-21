const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Debug endpoint to test JWT creation and verification
router.post('/debug-jwt', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required for testing' });
  }

  try {
    // Create a test JWT (simulating OTP verification)
    const testToken = jwt.sign(
      { email: email.toLowerCase(), otp_verified: true },
      JWT_SECRET,
      { expiresIn: '10m', algorithm: 'HS256' }
    );

    // Immediately verify it (simulating signup verification)
    const decoded = jwt.verify(testToken, JWT_SECRET, {
      algorithms: ['HS256'],
    });

    res.json({
      success: true,
      token: testToken,
      decoded: decoded,
      secretUsed: JWT_SECRET === 'changeme' ? 'default' : 'custom',
      message: 'JWT creation and verification successful',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      errorName: err.name,
      secretUsed: JWT_SECRET === 'changeme' ? 'default' : 'custom',
    });
  }
});

module.exports = router;
