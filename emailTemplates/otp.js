const fs = require('fs');
const path = require('path');

// Use the correct path to the template in emailTemplates/otp/otp_template.html
const templatePath = path.join(__dirname, 'otp', 'otp_template.html');

function loadOtpTemplate(code) {
  const rawHtml = fs.readFileSync(templatePath, 'utf-8');
  return rawHtml.replace('{{CODE}}', code);
}

module.exports = loadOtpTemplate;
