// api/daily-report.js

export default async function handler(req, res) {
  // 1. Secure the endpoint (so only Vercel Cron can trigger it)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const projectId = process.env.POSTHOG_PROJECT_ID;
    const posthogToken = process.env.POSTHOG_PERSONAL_API_KEY;

    // 2. Query PostHog for Pageviews over the last 24 hours
    // Using your specific API host based on your snippet
    const posthogUrl = `https://us.i.posthog.com/api/projects/${projectId}/insights/trend/`;
    
    const requestBody = {
      events: [{ id: '$pageview', name: '$pageview', type: 'events' }],
      date_from: '-1d'
    };

    const posthogResponse = await fetch(posthogUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${posthogToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!posthogResponse.ok) {
        throw new Error(`PostHog Error: ${posthogResponse.status}`);
    }

    const posthogData = await posthogResponse.json();
    
    // Extract the total count from PostHog's response array
    const pageViews = posthogData.result?.[0]?.count || 0;

    // 3. Format the Slack Message (using Slack Block Kit for a clean look)
    const slackPayload = {
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "📊 Daily App Analytics" }
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: `Good morning! Over the last 24 hours, your app received *${pageViews} pageviews*.` }
        }
      ]
    };

    // 4. Fire to your Slack Webhook
    const slackResponse = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
    });

    if (!slackResponse.ok) {
      throw new Error(`Slack Error: ${slackResponse.status}`);
    }

    return res.status(200).json({ success: true, pageViews });

  } catch (error) {
    console.error('Cron Job Failed:', error);
    return res.status(500).json({ error: error.message });
  }
}
