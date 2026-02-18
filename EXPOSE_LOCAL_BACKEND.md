# Expose Local Backend to Vercel Frontend

## Problem
Vercel (cloud) can't reach localhost:5000 (your computer)

## Solution: ngrok

### 1. Install ngrok
```bash
# Download from: https://ngrok.com/download
# Or use chocolatey:
choco install ngrok
```

### 2. Start Backend
```bash
cd server
node server.js
```

### 3. Expose with ngrok
```bash
ngrok http 5000
```

You'll get a URL like: `https://abc123.ngrok.io`

### 4. Update Vercel Environment Variable
Go to: https://vercel.com/your-project/settings/environment-variables

Set:
```
NEXT_PUBLIC_API_URL=https://abc123.ngrok.io
```

### 5. Update Backend CORS
In `server/.env`:
```env
CLIENT_URL=https://smart-lms-clean.vercel.app
```

### 6. Redeploy Vercel
```bash
git commit --allow-empty -m "trigger deploy"
git push
```

## Alternative: Deploy Backend to Render

Your backend is already on Render: `https://smart-lms-clean-1.onrender.com`

Just use that instead of localhost!

In Vercel environment variables:
```
NEXT_PUBLIC_API_URL=https://smart-lms-clean-1.onrender.com
```
