const fs = require('fs');
const path = require('path');

// Use the otp_template.html in the emailTemplates/otp folder
const templatePath = path.join(__dirname, 'otp_template.html');

function loadOtpTemplate(code) {
  const rawHtml = fs.readFileSync(templatePath, 'utf-8');
  return rawHtml.replace('{{CODE}}', code);
}

module.exports = loadOtpTemplate;
