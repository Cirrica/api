router.post('/', express.raw({ type: 'application/json' }), (req, res) => {
  console.log('✅ Webhook route hit');

  const signature = req.headers['x-hub-signature-256'];
  if (!signature || !WEBHOOK_SECRET) {
    return res.status(401).send('Missing signature or secret');
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(req.body);
  const digest = 'sha256=' + hmac.digest('hex');

  console.log(`🔐 Computed digest: ${digest}`);
  console.log(`📩 Received signature: ${signature}`);

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.headers['x-github-event'];
  console.log(`📦 GitHub Event: ${event}`);

  if (event === 'push' && WEBHOOK_ENABLED) {
    // Respond immediately:
    res.status(200).send('Webhook received, pulling changes...');

    console.log('🚀 Valid push event. Running pull.sh...');

    // Run pull.sh asynchronously after response sent:
    exec('./pull.sh', (err, stdout, stderr) => {
      if (err) {
        console.error('pull.sh error:', stderr);
        return;
      }
      console.log('pull.sh output:', stdout);
    });
  } else {
    res.status(200).send('No action');
  }
});
