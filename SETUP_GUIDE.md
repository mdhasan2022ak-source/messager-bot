# 🤖 Facebook Messenger AI Bot — Complete Setup Guide

> Follow these steps in order. Takes about 30–45 minutes.

---

## STEP 1 — Create a GitHub Repository

1. Go to [github.com](https://github.com) → Click **"New repository"**
2. Name it: `fb-messenger-bot`
3. Set to **Private**
4. Click **Create repository**
5. Upload all project files to this repository
   - Easiest way: drag and drop all the files into GitHub's web interface

---

## STEP 2 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up/login with GitHub
2. Click **"Add New Project"**
3. Import your `fb-messenger-bot` repository
4. Click **Deploy** (it will fail because env vars are missing — that's okay)

---

## STEP 3 — Create Vercel KV Database

1. In Vercel, go to your project dashboard
2. Click the **"Storage"** tab
3. Click **"Create Database"** → Choose **KV**
4. Name it: `messenger-bot-kv`
5. Click **Create**
6. Vercel will automatically add these environment variables to your project:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

---

## STEP 4 — Add All Environment Variables in Vercel

1. In Vercel, go to your project → **Settings** → **Environment Variables**
2. Add each variable below:

| Variable Name | Value | Where to get it |
|---|---|---|
| `FACEBOOK_PAGE_ACCESS_TOKEN` | (leave empty for now) | Facebook Developer Console (Step 5) |
| `FACEBOOK_VERIFY_TOKEN` | Any random string, e.g. `myBotToken2024` | **You create this yourself** |
| `ADMIN_PASSWORD` | Your chosen dashboard password | **You create this yourself** |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` | Your Vercel project URL |
| `KV_REST_API_URL` | (already added by Vercel KV step) | Auto-added |
| `KV_REST_API_TOKEN` | (already added by Vercel KV step) | Auto-added |

3. After adding all variables, go to **Deployments** → click your latest deployment → **Redeploy**

---

## STEP 5 — Set Up Facebook App

### 5a. Create Facebook Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **"My Apps"** → **"Create App"**
3. Choose **"Business"** type
4. Fill in app name (e.g., "My Messenger Bot") and contact email
5. Click **Create App**

### 5b. Add Messenger Product

1. In your app dashboard, click **"Add Product"**
2. Find **Messenger** → click **Set Up**

### 5c. Get Page Access Token

1. In Messenger settings, find **"Access Tokens"** section
2. Click **"Add or Remove Pages"** → Connect your Facebook Business Page
3. Click **"Generate Token"** next to your page
4. **Copy this token** — this is your `FACEBOOK_PAGE_ACCESS_TOKEN`
5. Go back to Vercel → paste it as the `FACEBOOK_PAGE_ACCESS_TOKEN` env var

### 5d. Set Up Webhook

1. In Messenger settings, find **"Webhooks"** section
2. Click **"Add Callback URL"**
3. Callback URL: `https://your-app.vercel.app/api/webhook`
4. Verify Token: the exact same string you set as `FACEBOOK_VERIFY_TOKEN` in Vercel
5. Click **"Verify and Save"** — if it shows ✅, it worked!
6. Under **"Webhook Fields"**, enable:
   - ✅ `messages`
   - ✅ `messaging_postbacks`

### 5e. Subscribe Webhook to Your Page

1. In Webhooks section, find your page
2. Click **"Subscribe"**

---

## STEP 6 — Get OpenRouter API Key

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up / Log in
3. Go to **Keys** → click **"Create Key"**
4. Copy the key (starts with `sk-or-v1-...`)
5. You'll paste this into your dashboard (NOT in Vercel env vars — it's stored securely in your database)

---

## STEP 7 — Configure Your Bot Dashboard

1. Go to `https://your-app.vercel.app/dashboard`
2. Log in with your `ADMIN_PASSWORD`
3. In **Bot Settings** (left side):
   - Paste your OpenRouter API key
   - Click **"Load Models"** to see all available AI models
   - Pick a model (free ones are marked 🆓)
   - Write your bot's personality in the **System Prompt** box
   - Add any discounts or events
4. Click **"Save All"**
5. Test in the **Chat Tester** (right side) — type a message and see how the bot responds

---

## STEP 8 — Test the Full Flow

1. Open Facebook Messenger
2. Go to your Business Page
3. Click **"Message"**
4. Send a message
5. The bot should reply within a few seconds! 🎉

---

## 🔧 Troubleshooting

### Bot not replying on Facebook?
- Check Vercel logs: Project → **Deployments** → Latest → **Functions** tab → `/api/webhook`
- Make sure `FACEBOOK_PAGE_ACCESS_TOKEN` is correct and not expired
- Make sure the webhook is subscribed to your page (Step 5e)
- Make sure you enabled `messages` in Webhook Fields

### "Verify and Save" failed in Facebook?
- Make sure your Vercel app is deployed and running
- Double-check that `FACEBOOK_VERIFY_TOKEN` in Vercel matches exactly what you typed in Facebook
- Try redeploying on Vercel first

### AI not responding / OpenRouter error?
- Check your OpenRouter API key is correct
- Make sure you have credits (or chose a free model)
- Check the model ID is correct

### Dashboard login not working?
- Make sure `ADMIN_PASSWORD` is set in Vercel environment variables
- Redeploy after adding/changing env vars

---

## 📁 Project File Structure

```
fb-messenger-bot/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts      ← Login endpoint
│   │   │   └── logout/route.ts     ← Logout endpoint
│   │   ├── chat/route.ts           ← Dashboard chat tester
│   │   ├── models/route.ts         ← Load OpenRouter models
│   │   ├── settings/route.ts       ← Save/load bot settings
│   │   └── webhook/route.ts        ← Facebook Messenger webhook
│   ├── dashboard/page.tsx          ← Admin dashboard
│   ├── login/page.tsx              ← Login page
│   ├── globals.css                 ← Styles
│   ├── layout.tsx                  ← Root layout
│   └── page.tsx                    ← Root redirect
├── components/
│   └── DashboardClient.tsx         ← Full dashboard UI
├── lib/
│   ├── auth.ts                     ← Session authentication
│   ├── facebook.ts                 ← Send Messenger messages
│   ├── kv.ts                       ← Vercel KV database helpers
│   └── openrouter.ts               ← AI chat + model fetching
├── middleware.ts                   ← Route protection
├── .env.example                    ← Environment variable template
├── next.config.js
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 🔐 Security Notes

- Your **Admin Password** is checked server-side and never exposed to the browser
- The **OpenRouter API key** is stored in Vercel KV (server-side database) — it's masked in the dashboard UI
- The **Facebook token** is only ever used in server-side API routes
- Session cookies are `httpOnly` (JavaScript cannot access them)
- The webhook endpoint validates Facebook's verify token before responding

---

## 💡 Tips

- **Free AI models**: Choose models with 🆓 in the dashboard. `meta-llama/llama-3.1-8b-instruct:free` is a great free option that's fast and smart.
- **System prompt tip**: Be specific! Tell the bot your business name, what you sell, your working hours, and what language(s) to prioritize.
- **Conversation memory**: Each customer's last 40 messages are stored for 30 days. After 30 days of inactivity, the memory is cleared.
- **Testing**: Always test in the Chat Tester before announcing the bot to customers.
