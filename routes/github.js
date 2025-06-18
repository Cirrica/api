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

  // Immediately respond to webhook so GitHub gets a 200 OK
  res.status(200).send('Webhook received, pulling changes...');

  // Then asynchronously handle the pull if enabled and event is push
  if (event === 'push' && WEBHOOK_ENABLED) {
    exec('./pull.sh', (err, stdout, stderr) => {
      if (err) {
        console.error('🔥 pull.sh error:', stderr);
        return;
      }
      console.log('✅ pull.sh output:', stdout);
    });
  } else {
    console.log(
      'ℹ️ No action taken (event:',
      event,
      ', enabled:',
      WEBHOOK_ENABLED,
      ')'
    );
  }
});
