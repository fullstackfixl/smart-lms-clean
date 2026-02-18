# 🚀 QUICK DEPLOY - Backend Local, Frontend Vercel

## What You Need:
1. Backend running on localhost:5000 ✅ (already running)
2. ngrok to expose backend to internet
3. Vercel to deploy frontend

---

## 🎯 FASTEST METHOD - 3 Steps:

### Terminal 1: Backend (Already Running)
```bash
cd server
npm start
```
✅ Keep this running

### Terminal 2: Start ngrok
```bash
# Download ngrok first if you don't have it:
# https://ngrok.com/download
# Extract and run:

ngrok http 5000
```

📋 **COPY THE HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

### Terminal 3: Deploy Frontend
```bash
cd client

# Update .env.production with your ngrok URL
echo NEXT_PUBLIC_API_URL=https://YOUR-NGROK-URL.ngrok-free.app > .env.production
echo NEXT_PUBLIC_APP_URL=https://smart-lms-clean.vercel.app >> .env.production
echo NODE_ENV=production >> .env.production

# Build and deploy
npm run build
vercel --prod
```

### Final Step: Update Backend CORS
Edit `server/src/app.js` line 82-86:
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL || 'http://localhost:3000',
  'https://smart-lms-clean.vercel.app',
  'https://YOUR-NGROK-URL.ngrok-free.app', // ADD THIS LINE
  ''
];
```

Restart backend (Ctrl+C then `npm start`)

---

## ✅ DONE!

Your app is now live:
- Frontend: https://smart-lms-clean.vercel.app
- Backend: https://YOUR-NGROK-URL.ngrok-free.app (proxies to localhost:5000)

Test: https://smart-lms-clean.vercel.app/login
- Email: instructor@test.com
- Password: password123

---

## 🔄 Alternative: Use Cloudflare Tunnel (No Account)

Instead of ngrok, use cloudflared:
```bash
# Download: https://github.com/cloudflare/cloudflared/releases
cloudflared tunnel --url http://localhost:5000
```

Copy the URL and use it same as ngrok URL above.

---

## ⚠️ IMPORTANT NOTES:

1. **Keep ngrok running** - If you close it, frontend can't reach backend
2. **ngrok URL changes** - Free ngrok gives new URL each time you restart
3. **For permanent solution** - Deploy backend to Render/Railway/Heroku

---

## 🆘 Troubleshooting:

**CORS Error?**
- Add ngrok URL to server/src/app.js allowedOrigins
- Restart backend

**401 Unauthorized?**
- Clear browser cookies
- Login again

**Can't connect to backend?**
- Check ngrok is running
- Check backend is running
- Verify ngrok URL in .env.production

**Vercel deployment fails?**
- Run `npm install` in client folder
- Check for build errors
- Try `vercel --prod --force`
