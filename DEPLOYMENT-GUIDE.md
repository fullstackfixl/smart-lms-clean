# Deployment Guide - Smart LMS

## Quick Setup for Demo (Frontend on Vercel + Local Backend)

### Step 1: Expose Local Backend to Internet

You need to expose your local backend (running on port 5000) to the internet so Vercel can access it.

#### Option A: Using ngrok (Recommended)
```bash
# Install ngrok from https://ngrok.com/download
# Or use: choco install ngrok (Windows)

# Start ngrok tunnel
ngrok http 5000

# You'll get a URL like: https://abc123.ngrok-free.app
# Copy this URL for the next step
```

#### Option B: Using localtunnel
```bash
# Install localtunnel
npm install -g localtunnel

# Start tunnel
lt --port 5000

# You'll get a URL like: https://xyz.loca.lt
# Copy this URL for the next step
```

#### Option C: Using Cloudflare Tunnel (Free, No Account Required)
```bash
# Download cloudflared from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# Start tunnel
cloudflared tunnel --url http://localhost:5000

# You'll get a URL like: https://abc-def-ghi.trycloudflare.com
# Copy this URL for the next step
```

### Step 2: Update Backend CORS

Update `server/.env` to allow your Vercel domain:

```env
CLIENT_URL=https://smart-lms-clean.vercel.app
```

Update `server/src/app.js` CORS configuration (already done):
```javascript
const allowedOrigins = [
  'https://smart-lms-clean.vercel.app',
  'http://localhost:3000',
  // Add your ngrok URL here if needed
];
```

### Step 3: Start Local Backend

```bash
cd server
npm start
# Backend should be running on http://localhost:5000
```

### Step 4: Update Frontend Environment Variable

Update `client/.env.production` with your tunnel URL:

```env
NEXT_PUBLIC_API_URL=https://your-tunnel-url-here.ngrok-free.app
NEXT_PUBLIC_APP_URL=https://smart-lms-clean.vercel.app
NODE_ENV=production
```

### Step 5: Build Frontend

```bash
cd client
npm run build
```

### Step 6: Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd client
vercel --prod
```

#### Option B: Using Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your GitHub repository
4. Set Root Directory to `client`
5. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL` = Your ngrok/tunnel URL
   - `NEXT_PUBLIC_APP_URL` = https://smart-lms-clean.vercel.app
   - `NODE_ENV` = production
6. Click "Deploy"

### Step 7: Test the Deployment

1. Open your Vercel URL: https://smart-lms-clean.vercel.app
2. Login with test credentials:
   - **Instructor**: instructor@test.com / password123
   - **Student**: student1@test.com / password123
   - **Org Admin**: orgadmin@test.com / password123

3. Test features:
   - ✅ Login/Authentication
   - ✅ Instructor Dashboard
   - ✅ Create Course
   - ✅ Add Modules & Lessons
   - ✅ Upload Videos
   - ✅ Schedule Live Classes (Jitsi)
   - ✅ Student Dashboard
   - ✅ Browse Courses
   - ✅ Enroll in Courses
   - ✅ View Live Classes

## Important Notes

### For Demo Presentation:

1. **Keep Backend Running**: Make sure your local backend is running during the demo
2. **Keep Tunnel Active**: Keep ngrok/localtunnel running during the demo
3. **Test Before Demo**: Test all features before presenting to your senior
4. **Have Backup**: Have screenshots/recordings ready in case of network issues

### Tunnel URLs:
- ngrok URLs are temporary and change when you restart
- For a permanent solution, deploy backend to Render/Railway/Heroku
- Free ngrok accounts have a 2-hour session limit

### CORS Issues:
If you get CORS errors:
1. Make sure your tunnel URL is added to backend CORS whitelist
2. Restart backend after updating CORS settings
3. Clear browser cache and try again

### Environment Variables on Vercel:
You can update environment variables without redeploying:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_URL` with new tunnel URL
3. Redeploy (Vercel will rebuild with new variables)

## Quick Commands Reference

```bash
# Start Backend
cd server
npm start

# Start ngrok
ngrok http 5000

# Build Frontend
cd client
npm run build

# Deploy to Vercel
cd client
vercel --prod

# Test locally before deploying
cd client
npm run dev
```

## Troubleshooting

### Issue: "Failed to fetch" errors
**Solution**: Check if backend is running and tunnel is active

### Issue: CORS errors
**Solution**: Add tunnel URL to backend CORS whitelist in `server/src/app.js`

### Issue: 401 Unauthorized
**Solution**: Clear browser cookies and login again

### Issue: Video upload fails
**Solution**: Check Cloudinary credentials in `server/.env`

### Issue: Email notifications not working
**Solution**: Check Gmail credentials in `server/.env`

## Production Deployment (Full)

For a production deployment where both frontend and backend are hosted:

1. **Backend**: Deploy to Render/Railway/Heroku
2. **Frontend**: Deploy to Vercel
3. **Database**: Use MongoDB Atlas (already configured)
4. **File Storage**: Use Cloudinary (already configured)
5. **Email**: Use Gmail SMTP (already configured)

Update environment variables accordingly and you're good to go!
