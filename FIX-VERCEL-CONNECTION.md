# 🔧 FIX: Vercel Can't Connect to Backend

## Problem:
Vercel is trying to connect to `http://localhost:5000` which doesn't work because:
- localhost = YOUR computer
- Vercel servers can't reach YOUR computer
- You need to expose your backend to the internet

## Solution: Use ngrok

### Step 1: Download ngrok
https://ngrok.com/download
Extract ngrok.exe

### Step 2: Start ngrok
```bash
ngrok http 5000
```

You'll see:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:5000
```

📋 **COPY THIS URL**: `https://abc123.ngrok-free.app`

### Step 3: Update Vercel Environment Variable
Go to: https://vercel.com/your-username/smart-lms-clean/settings/environment-variables

Add or Update:
- Name: `NEXT_PUBLIC_API_URL`
- Value: `https://abc123.ngrok-free.app` (your ngrok URL)
- Environment: Production ✓

Click "Save"

### Step 4: Update Backend CORS
Edit `server/src/app.js` line 85:
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL || 'http://localhost:3000',
  'https://smart-lms-clean.vercel.app',
  'https://abc123.ngrok-free.app', // YOUR NGROK URL
  ''
];
```

Restart backend:
```bash
cd server
# Press Ctrl+C
npm start
```

### Step 5: Redeploy Vercel
```bash
cd client
vercel --prod
```

OR just push to GitHub and Vercel auto-deploys

## ✅ Done!

Test: https://smart-lms-clean.vercel.app/login

---

## Alternative: Deploy Backend to Render

If you don't want to keep ngrok running:

1. Go to: https://render.com
2. Create account (free)
3. New Web Service
4. Connect GitHub repo
5. Deploy backend
6. Get URL: `https://your-app.onrender.com`
7. Update Vercel env var with Render URL
8. Redeploy

---

## Quick Test:

Check if ngrok is working:
```bash
curl https://YOUR-NGROK-URL.ngrok-free.app/health
```

Should return: `{"status":"ok"}`
