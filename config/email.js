const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 587,
  secure: false,
  auth: {
    user: 'noreply@cirrica.com',
    pass: process.env.ZOHO_API_KEY,
  },
});

module.exports = transporter;
