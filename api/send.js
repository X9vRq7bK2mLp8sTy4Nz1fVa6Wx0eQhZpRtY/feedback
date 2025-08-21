export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, type } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get client IP address
    const clientIP = req.headers['x-forwarded-for'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null);

    // Get current date and time
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    // Determine emoji based on feedback type
    let emoji = '✅';
    if (type === 'heart') emoji = '💗';
    if (type === 'xmark') emoji = '❌';

    // Create Discord webhook payload
    const discordPayload = {
      embeds: [
        {
          title: "New Feedback",
          color: type === 'checkmark' ? 0x4ade80 : type === 'heart' ? 0xff0050 : 0x00b3ff,
          fields: [
            {
              name: "Opinion:",
              value: `${emoji}`,
              inline: true
            },
            {
              name: "Feedback:",
              value: `\`\`\`${message}\`\`\``
            }
          ],
          footer: {
            text: `${dateStr} • ${timeStr}  ||  IP: ${clientIP}`
          },
          timestamp: now.toISOString()
        }
      ]
    };

    // Replace with your actual Discord webhook URL
    const webhookURL = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookURL) {
      console.error('DISCORD_WEBHOOK_URL environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Send to Discord webhook
    const discordResponse = await fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload),
    });

    if (!discordResponse.ok) {
      throw new Error('Failed to send message to Discord');
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
