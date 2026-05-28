// ─────────────────────────────────────────────────────────────────
//  CCENA — Netlify serverless proxy for Anthropic Claude API
//  Keeps ANTHROPIC_API_KEY server-side; avoids browser CORS issues.
//
//  Deploy steps:
//  1. Push this repo to GitHub and connect to Netlify.
//  2. In Netlify → Site configuration → Environment variables, add:
//       ANTHROPIC_API_KEY = sk-ant-...
//  3. Redeploy.
// ─────────────────────────────────────────────────────────────────

const https = require('https');

exports.handler = async (event) => {
  // ── CORS pre-flight ──────────────────────────────────────────
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // ── API key check ─────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'ANTHROPIC_API_KEY is not set. Add it in Netlify → Site configuration → Environment variables, then redeploy.',
      }),
    };
  }

  // ── Parse request body ────────────────────────────────────────
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid JSON in request body' }),
    };
  }

  const { system, messages } = body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'messages array is required' }),
    };
  }

  // ── Build Anthropic payload ───────────────────────────────────
  const payload = JSON.stringify({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    ...(system ? { system } : {}),
    messages,
  });

  // ── Call Anthropic API via native https ───────────────────────
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          // On non-200, normalise to a plain { error: "..." } shape
          // so the frontend error handling always gets a string.
          if (res.statusCode !== 200) {
            let message = `Anthropic API error ${res.statusCode}`;
            try {
              const parsed = JSON.parse(raw);
              if (parsed.error && parsed.error.message) {
                message = parsed.error.message;
              }
            } catch { /* ignore */ }

            resolve({
              statusCode: res.statusCode,
              headers: corsHeaders,
              body: JSON.stringify({ error: message }),
            });
            return;
          }

          resolve({
            statusCode: 200,
            headers: corsHeaders,
            body: raw,           // Forward raw Anthropic response (content[].text etc.)
          });
        });
      }
    );

    req.on('error', (err) => {
      resolve({
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({ error: `Network error reaching Anthropic: ${err.message}` }),
      });
    });

    req.setTimeout(55000, () => {
      req.destroy();
      resolve({
        statusCode: 504,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request to Anthropic timed out. Please try again.' }),
      });
    });

    req.write(payload);
    req.end();
  });
};
