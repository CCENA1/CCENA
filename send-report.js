// netlify/functions/send-report.js
// Sends a PDF summary via email using SendGrid
const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const sgKey = process.env.SENDGRID_API_KEY;
  if (!sgKey) {
    // No SendGrid key configured — return success so UI still works
    return { statusCode: 200, body: JSON.stringify({ ok: true, mock: true }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { to, name, subject, html, pdfBase64, refCode } = body;
  if (!to || !html) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  const fromEmail = process.env.FROM_EMAIL || 'reports@ccena.io';
  const fromName  = 'CCENA — Expert Neutral Advice';

  const payload = {
    personalizations: [{ to: [{ email: to, name: name || '' }] }],
    from: { email: fromEmail, name: fromName },
    reply_to: { email: fromEmail, name: fromName },
    subject: subject || `Your CCENA Expert Report — Ref ${refCode}`,
    content: [
      { type: 'text/html', value: html }
    ]
  };

  // Attach PDF if provided
  if (pdfBase64) {
    payload.attachments = [{
      content: pdfBase64,
      filename: `CCENA-Report-${refCode}.pdf`,
      type: 'application/pdf',
      disposition: 'attachment'
    }];
  }

  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sgKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: 200, body: JSON.stringify({ ok: true }) });
        } else {
          resolve({ statusCode: res.statusCode, body: JSON.stringify({ error: body || 'SendGrid error' }) });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ statusCode: 502, body: JSON.stringify({ error: e.message }) });
    });

    req.write(data);
    req.end();
  });
};
