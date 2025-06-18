const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
require('dotenv').config();

const router = express.Router();

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const WEBHOOK_ENABLED = process.env.GITHUB_WEBHOOK_ENABLED === 'true';

router.post('/', express.raw({ type: 'application/json' }), (req, res) => {
  console.log('✅ Webhook route hit');

  const signature = req.headers['x-hub-signature-256'];
  if (!signature || !WEBHOOK_SECRET) {
    console.warn('❌ Missing signature or secret');
    return res.status(401).send('Missing signature or secret');
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(req.body);
  const digest = 'sha256=' + hmac.digest('hex');

  console.log('🔐 Computed digest:', digest);
  console.log('📩 Received signature:', signature);

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    console.warn('❌ Signature mismatch');
    return res.status(401).send('Invalid signature');
  }

  const event = req.headers['x-github-event'];
  console.log('📦 GitHub Event:', event);

  if (event === 'push' && WEBHOOK_ENABLED) {
    console.log('🚀 Valid push event. Running pull.sh...');
    res.status(200).send('Script executing');
    exec('./pull.sh', (err, stdout, stderr) => {
      if (err) {
        console.error('🔥 pull.sh error:', stderr);
        return res.status(500).send('Script failed');
      }
      return console.log('✅ pull.sh output:', stdout);
    });
  } else {
    console.log(
      'ℹ️ No action taken (event:',
      event,
      ', enabled:',
      WEBHOOK_ENABLED,
      ')'
    );
    return res.status(200).send('No action');
  }
});

module.exports = router;
