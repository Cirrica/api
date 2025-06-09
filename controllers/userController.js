const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const loadOtpTemplate = require('../emailTemplates/otp');
const transporter = require('../config/email');

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
  res.json({ user });
};

// Send OTP (email)
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  const user = await getUserByEmail(email);
  if (!user) return res.status(400).json({ error: 'User not found' });
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await supabase.from('otps').insert([
    {
      user_id: user.user_id,
      code,
      expires_at: expiresAt,
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

// Verify OTP
exports.verifyOtp = async (req, res) => {
  const { email, code } = req.body;
  const user = await getUserByEmail(email);
  if (!user) return res.status(400).json({ error: 'User not found' });
  const { data, error } = await supabase
    .from('otps')
    .select('*')
    .eq('user_id', user.user_id)
    .eq('code', code)
    .gt('expires_at', new Date().toISOString())
    .single();
  if (error || !data)
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  // Optionally delete OTP after use
  await supabase.from('otps').delete().eq('id', data.id);
  // Set user as verified
  await supabase
    .from('users')
    .update({ is_verified: true })
    .eq('user_id', user.user_id);
  res.json({ message: 'OTP verified' });
};
