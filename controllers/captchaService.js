const express = require('express');
const fetch = require('node-fetch'); // or use built-in fetch in newer Node versions
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Replace with your secret key (keep this private!)
const RECAPTCHA_SECRET_KEY = '6LfIemArAAAAAEbpLyvymAtJSp4j0oHOdeAesjN4';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/signup', async (req, res) => {
  const token = req.body['g-recaptcha-response'];

  if (!token) {
    return res.status(400).json({ success: false, message: 'No reCAPTCHA token provided' });
  }

  const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${token}`;

  try {
    const response = await fetch(verificationUrl, { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      // CAPTCHA passed, proceed with signup logic
      res.json({ success: true, message: 'CAPTCHA verified. Signup successful!' });
    } else {
      // CAPTCHA failed
      res.status(400).json({ success: false, message: 'CAPTCHA verification failed' });
    }
  } catch (error) {
    console.error('Error verifying CAPTCHA:', error);
    res.status(500).json({ success: false, message: 'Server error verifying CAPTCHA' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});