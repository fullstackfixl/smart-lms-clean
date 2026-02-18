# 🚀 Deployment Summary - Vercel + Local Backend

## Current Setup:
- ✅ Backend: Running on localhost:5000
- ✅ Frontend: Ready to deploy to Vercel
- ✅ Database: MongoDB Atlas (connected)
- ✅ Build: Passing (0 errors)
- ✅ Lint: Passing (warnings only)
- ✅ TypeScript: Passing

## What You Need to Do:

### 1. Install ngrok (One-time)
Download from: https://ngrok.com/download
Extract ngrok.exe to any folder

### 2. Start ngrok
```bash
ngrok http 5000
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

### 3. Update Backend CORS
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

Restart backend: `Ctrl+C` then `npm start`

### 4. Update Frontend Environment
Edit `client/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://abc123.ngrok-free.app
NEXT_PUBLIC_APP_URL=https://smart-lms-clean.vercel.app
NODE_ENV=production
```

### 5. Deploy to Vercel
```bash
cd client
npm run build
vercel --prod
```

## 🎯 Result:
- Frontend: https://smart-lms-clean.vercel.app
- Backend: https://abc123.ngrok-free.app → localhost:5000

## 📝 Test Accounts:
- Instructor: instructor@test.com / password123
- Student: student1@test.com / password123
- Org Admin: orgadmin@test.com / password123

## ⚠️ Important Notes:

1. **Keep ngrok running** - Frontend needs it to reach backend
2. **ngrok URL changes** - Free version gives new URL each restart
3. **For production** - Deploy backend to Render/Railway/Heroku

## 🔄 Alternative: Cloudflare Tunnel
Instead of ngrok:
```bash
cloudflared tunnel --url http://localhost:5000
```
Download from: https://github.com/cloudflare/cloudflared/releases

## 📁 Files Created:
- `START-HERE.txt` - Quick start guide
- `QUICK-DEPLOY.md` - Detailed instructions
- `setup-and-deploy.ps1` - Automated PowerShell script
- `deploy-to-vercel.bat` - Automated batch script
- `SETUP-NGROK.md` - ngrok setup guide

## 🆘 Troubleshooting:

**CORS Error:**
- Add ngrok URL to server/src/app.js
- Restart backend

**401 Unauthorized:**
- Clear cookies
- Login again

**Can't connect:**
- Check ngrok running
- Check backend running
- Verify URLs match

## ✅ Everything is Ready!

Just follow START-HERE.txt and you'll be live in 5 minutes!
