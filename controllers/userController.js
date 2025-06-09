const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Helper: Find user by email
async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  if (error) return null;
  return data;
}

// Signup
exports.signup = async (req, res) => {
  const { firstName, lastName, email, password, otpToken } = req.body;
  if (!firstName || !lastName || !email || !password || !otpToken) {
    return res
      .status(400)
      .json({ error: 'All fields and OTP verification required' });
  }
  // Verify OTP session token (JWT)
  let decoded;
  try {
    decoded = jwt.verify(otpToken, JWT_SECRET);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid or expired OTP session' });
  }
  if (!decoded || decoded.email !== email || !decoded.otp_verified) {
    return res.status(400).json({ error: 'OTP verification required' });
  }
  if (await getUserByEmail(email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const hash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        user_id: uuidv4(),
        first_name: firstName,
        last_name: lastName,
        email,
        password: hash,
        is_verified: true, // Securely set by backend after OTP JWT check
      },
    ])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ user: data[0] });
};

// Signin
exports.signin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const user = await getUserByEmail(email);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
  // Create JWT (do not include password)
  const token = jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_verified: user.is_verified,
      signup_date: user.signup_date,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token });
};

// Delete temp user (for email existence check)
exports.deleteTemp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  // Only delete if user is not verified and password is dummy
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('email', email)
    .eq('is_verified', false)
    .eq('password', await bcrypt.hash('dummyPassword123!', 10));
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Temp user deleted' });
};

// Check if email exists (no user creation)
exports.checkEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const user = await getUserByEmail(email);
  if (user) return res.json({ exists: true });
  res.json({ exists: false });
};
