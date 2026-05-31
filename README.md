# CCENA — Netlify Deployment Guide

## Files in this package

```
ccena/
├── index.html                        ← Main single-page application
├── netlify.toml                      ← Netlify build & routing config
├── netlify/
│   └── functions/
│       ├── ask-claude.js             ← AI consultation proxy (Claude API)
│       └── send-report.js            ← Email report sender (SendGrid)
└── README.md                         ← This file
```

---

## Step 1 — Deploy to Netlify

### Option A: Drag & Drop (quickest)
1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Deploy manually**
2. Drag the **entire `ccena/` folder** onto the Netlify deploy area
3. Your site will be live in ~30 seconds

### Option B: GitHub (recommended for updates)
1. Create a new GitHub repo and push the `ccena/` folder contents as the root
2. In Netlify → **Add new site** → **Import from Git** → connect your repo
3. Netlify will auto-deploy on every push

---

## Step 2 — Set Environment Variables (Required)

In your Netlify site → **Site settings** → **Environment variables**, add:

| Variable | Value | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (from [console.anthropic.com](https://console.anthropic.com)) | ✅ Required |
| `SENDGRID_API_KEY` | Your SendGrid API key | Optional (email feature) |
| `FROM_EMAIL` | e.g. `reports@yourdomain.com` | Optional (email sender) |

**To get your Anthropic API key:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create new key
3. Copy and paste into Netlify environment variable

**After adding variables:**
- Go to **Deploys** → **Trigger deploy** → **Deploy site** to apply

---

## Step 3 — Email Setup (Optional but recommended)

The email feature sends a PDF-style HTML report to the user's inbox automatically.

### Using SendGrid (free tier: 100 emails/day)
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Settings → API Keys → Create API Key (Mail Send permission)
3. Add as `SENDGRID_API_KEY` in Netlify environment variables
4. Verify your sender email at SendGrid → **Sender Authentication**
5. Set `FROM_EMAIL` to your verified sender address

> Without `SENDGRID_API_KEY`, the "Email Report" button still shows the Done screen — it just won't send an actual email. The Download button always works.

---

## Features Summary

| Feature | Description |
|---|---|
| 🎨 Redesigned UI | Vibrant coral/amber/emerald palette, Syne + Outfit fonts, animated mesh background |
| 🧪 Smart Logo | Animated chemical flask logo with rotating gradient ring on welcome screen |
| 💡 Context Hints | Scope-aware expert tips appear after selecting a scope in Step 2 |
| 🧠 Smart Questions | Step 3 title/subtitle adapts to the selected scope for relevant questioning |
| ✅ Multi-select Report | Users can choose: Neutral Spec + Mapei products + Multi-brand + Application guide + Failure modes — any combination |
| 🏭 Mapei Product DB | Curated Mapei product suggestions for all 10 scopes from the mapei.com product range |
| 📧 Auto Email | HTML report with Mapei suggestions sent automatically to user email via SendGrid |
| 🤖 AI Concise Output | System prompt engineered for brief, punchy, direct advice (no waffle) |
| 📱 Mobile Responsive | Full responsive design for all screen sizes |

---

## Custom Domain

1. Netlify → **Domain settings** → **Add custom domain**
2. Add your domain (e.g. `ccena.io` or `app.ccena.io`)
3. Update your DNS to point to Netlify (they guide you through it)

---

## Troubleshooting

**"No API key set" error:**
→ ANTHROPIC_API_KEY not set in Netlify environment variables. See Step 2.

**AI report not generating:**
→ Check Netlify → Functions → ask-claude → logs for errors

**Emails not sending:**
→ Check SENDGRID_API_KEY is correct and sender email is verified in SendGrid

**Functions returning 502:**
→ Redeploy after adding environment variables (they don't apply retroactively)
