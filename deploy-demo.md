# Quick Demo Deployment Steps

## 🚀 Fast Setup (5 minutes)

### 1. Start Backend (Terminal 1)
```bash
cd server
npm start
```
✅ Backend running on http://localhost:5000

### 2. Expose Backend with ngrok (Terminal 2)
```bash
# Download ngrok: https://ngrok.com/download
# Or install: choco install ngrok

ngrok http 5000
```
📋 **Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

### 3. Update Frontend Environment
Edit `client/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://abc123.ngrok-free.app
NEXT_PUBLIC_APP_URL=https://smart-lms-clean.vercel.app
NODE_ENV=production
```

### 4. Update Backend CORS
Edit `server/src/app.js` - Add your ngrok URL to allowedOrigins:
```javascript
const allowedOrigins = [
  'https://smart-lms-clean.vercel.app',
  'http://localhost:3000',
  'https://abc123.ngrok-free.app', // Add this
];
```

Restart backend (Ctrl+C and `npm start` again)

### 5. Build Frontend (Terminal 3)
```bash
cd client
npm run build
```

### 6. Deploy to Vercel
```bash
# Install Vercel CLI if not installed
npm install -g vercel

# Deploy
vercel --prod
```

Or push to GitHub and deploy from Vercel Dashboard.

## 🎯 Test Credentials

**Instructor Account:**
- Email: instructor@test.com
- Password: password123

**Student Account:**
- Email: student1@test.com  
- Password: password123

**Org Admin Account:**
- Email: orgadmin@test.com
- Password: password123

## ✅ Features to Demo

1. **Login** - Show authentication works
2. **Instructor Dashboard** - Real data from MongoDB
3. **Create Course** - Add modules and lessons
4. **Upload Video** - Cloudinary integration
5. **Schedule Live Class** - Jitsi meeting + Email to students
6. **Student Dashboard** - Show enrolled courses
7. **Browse Courses** - Organization-scoped courses
8. **Enroll in Course** - Student enrollment flow

## 🔥 Pro Tips

- Keep ngrok running during demo
- Test everything before presenting
- Have backup screenshots ready
- Clear browser cache if issues occur
- Use incognito mode for clean demo

## 📱 Alternative: Use Cloudflare Tunnel (No Account Needed)

```bash
# Download: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

cloudflared tunnel --url http://localhost:5000
```

This gives you a free HTTPS URL instantly!

## 🆘 Quick Fixes

**CORS Error?**
- Add ngrok URL to backend CORS whitelist
- Restart backend

**401 Error?**
- Clear cookies and login again

**Build Error?**
- Run `npm install` in client folder
- Check for TypeScript errors

**Can't connect to backend?**
- Check if backend is running
- Check if ngrok is active
- Verify ngrok URL in .env.production
