export default async function handler(req, res) {
  // Only allow POST requests from Slack
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // 1. Initial Slack URL Verification (Required by Slack)
  if (req.body.type === 'url_verification') {
    return res.status(200).json({ challenge: req.body.challenge });
  }

  // 2. Handle the Bot being tagged in Slack
  if (req.body.event?.type === 'app_mention') {
    // We will add the logic to pull from PostHog here in the next step
    console.log("Slack bot was tagged!");
  }

  return res.status(200).json({ ok: true });
}