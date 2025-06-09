const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const loadOtpTemplate = require('../emailTemplates/otp');
const transporter = require('../config/email');
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
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
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

// Send OTP (email) for signup (no user required yet)
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  // Don't allow sending OTP if user already exists
  if (await getUserByEmail(email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  // Generate OTP and store with email only (no user_id)
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  // Save OTP with email (add email column to otps table if not present)
  await supabase.from('otps').insert([
    {
      code,
      expires_at: expiresAt,
      email,
    },
  ]);
  const htmlContent = loadOtpTemplate(code);
  await transporter.sendMail({
    from: 'No-Reply <noreply@cirrica.com>',
    to: email,
    subject: 'One-Time Code - Cirrica Capital',
    text: `Here is your one-time code: ${code}`,
    html: htmlContent,
  });
  res.json({ message: 'OTP sent' });
};

// Verify OTP for signup (no user required yet)
exports.verifyOtp = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code)
    return res.status(400).json({ error: 'Email and code required' });
  const { data, error } = await supabase
    .from('otps')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .gt('expires_at', new Date().toISOString())
    .single();
  if (error || !data)
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  // Optionally delete OTP after use
  await supabase.from('otps').delete().eq('id', data.id);
  res.json({ message: 'OTP verified' });
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
