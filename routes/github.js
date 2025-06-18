const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
require('dotenv').config();

const router = express.Router();

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const WEBHOOK_ENABLED = process.env.GITHUB_WEBHOOK_ENABLED === 'true';

function verifySignature(req, buf) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature || !WEBHOOK_SECRET) return false;
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(buf);
  const digest = 'sha256=' + hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

router.post('/', express.raw({ type: 'application/json' }), (req, res) => {
  if (!verifySignature(req, req.body)) {
    return res.status(401).send('Invalid signature');
  }
  const event = req.headers['x-github-event'];
  if (event === 'push' && WEBHOOK_ENABLED) {
    exec('./pull.sh', (err, stdout, stderr) => {
      if (err) {
        console.error('pull.sh error:', stderr);
        return res.status(500).send('Script failed');
      }
      console.log('pull.sh output:', stdout);
      return res.status(200).send('Script executed');
    });
  } else {
    res.status(200).send('No action');
  }
});

module.exports = router;
