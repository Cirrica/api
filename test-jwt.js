const jwt = require('jsonwebtoken');

// Test JWT creation and verification with the default secret
const JWT_SECRET = 'changeme';
const testEmail = 'test@example.com';

console.log('Testing JWT with secret:', JWT_SECRET);

// Create a token (like in OTP verification)
const otpToken = jwt.sign(
  { email: testEmail, otp_verified: true },
  JWT_SECRET,
  {
    expiresIn: '10m',
    algorithm: 'HS256',
  }
);

console.log('Created token:', otpToken);

// Verify the token (like in signup)
try {
  const decoded = jwt.verify(otpToken, JWT_SECRET, { algorithms: ['HS256'] });
  console.log('Token verified successfully:', decoded);
} catch (err) {
  console.error('Token verification failed:', err.message);
  console.error('Error name:', err.name);
}
