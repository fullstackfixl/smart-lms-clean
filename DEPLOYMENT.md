# Smart LMS Deployment Guide

Complete guide for deploying Smart LMS to production (Vercel + Render).

## Quick Start

### Prerequisites
- GitHub repository with your code
- Vercel account (free tier works)
- Render account (free tier works)
- MongoDB Atlas database
- Cloudinary account for file uploads

### Deployment URLs
- **Frontend**: https://smart-lms-clean.vercel.app
- **Backend**: https://smart-lms-clean-1.onrender.com

---

## Frontend Deployment (Vercel)

### 1. Initial Setup

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `client`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 2. Environment Variables

Add these in Vercel dashboard (Settings → Environment Variables):

```env
NEXT_PUBLIC_API_URL=https://smart-lms-clean-1.onrender.com
NEXT_PUBLIC_APP_URL=https://smart-lms-clean.vercel.app
```

### 3. Deploy

Click "Deploy" - Vercel will auto-deploy on every push to main branch.

---

## Backend Deployment (Render)

### 1. Initial Setup

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `smart-lms-backend`
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

### 2. Environment Variables

Add these in Render dashboard (Environment tab):

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-lms
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
CLIENT_URL=https://smart-lms-clean.vercel.app

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
SUPPORT_EMAIL=your-email@gmail.com

# Payment Gateways (Optional)
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable

# Redis (Optional - for caching)
REDIS_URL=redis://your-redis-url

# Notifications (Optional)
ENABLE_NOTIFICATIONS=false
ENABLE_PUSH_NOTIFICATIONS=false
ENABLE_EMAIL_NOTIFICATIONS=true
```

### 3. Deploy

Click "Create Web Service" - Render will auto-deploy on every push to main branch.

---

## Important Notes

### Render Free Tier Limitations
- **Spins down after 15 minutes** of inactivity
- Takes **30-60 seconds** to wake up on first request
- Solution: Use [cron-job.org](https://cron-job.org) to ping `/health` every 10 minutes
- Or upgrade to paid plan ($7/month) for always-on service

### Docker Deployment
If deploying via Docker, ensure `package-lock.json` is committed (not in `.gitignore`).

### CORS Configuration
Backend is configured to allow:
- `https://smart-lms-clean.vercel.app` (production)
- `https://smart-lms-clean-*.vercel.app` (preview deployments)
- `http://localhost:3000` (local development)

---

## Testing Deployment

### 1. Test Backend Health
```bash
curl https://smart-lms-clean-1.onrender.com/health
```

Expected response:
```json
{
  "success": true,
  "message": "Smart LMS API is running",
  "data": {
    "timestamp": "2026-02-18T...",
    "environment": "production",
    "uptime": 123.45
  }
}
```

### 2. Test Frontend
1. Visit https://smart-lms-clean.vercel.app
2. Open browser console (F12)
3. Go to Network tab
4. Try to register/login
5. Verify API calls go to Render backend
6. Verify no CORS errors

### 3. Test CORS
```bash
curl -H "Origin: https://smart-lms-clean.vercel.app" \
     -X OPTIONS \
     https://smart-lms-clean-1.onrender.com/auth/login
```

Should return CORS headers in response.

---

## Local Development

### Frontend (Port 3000)
```bash
cd client
npm install
npm run dev
```

Environment: `client/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Backend (Port 5000)
```bash
cd server
npm install
npm start
```

Environment: `server/.env`
```env
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/smart-lms
# ... other vars
```

---

## Troubleshooting

### Frontend Build Fails
- Run `npm run build` locally to check for errors
- Verify all environment variables are set in Vercel
- Check build logs in Vercel dashboard
- Ensure Next.js version is 15.5.12 or higher (security fix)

### Backend Crashes
- Check logs in Render dashboard
- Verify MongoDB connection string is correct
- Ensure all required environment variables are set
- Check for port conflicts (should use PORT env var)

### CORS Errors
- Verify `CLIENT_URL` in backend matches frontend URL exactly
- Restart backend service in Render
- Clear browser cache and cookies
- Check CORS configuration in `server/src/app.js`

### "Failed to Fetch" Error
- If frontend is on Vercel and backend is localhost: **This won't work!**
  - Vercel (cloud) cannot reach your localhost (local computer)
  - Solution: Deploy backend to Render OR use ngrok to expose localhost
- If both are deployed: Check backend is awake (Render free tier sleeps)

### GitHub Actions Failing
- ESLint errors: Run `npm run lint` locally and fix issues
- Build errors: Run `npm run build` locally
- CodeQL warnings: Update to `@v3` in `.github/workflows/ci-cd.yml`

---

## CI/CD Pipeline

GitHub Actions automatically runs on every push:
1. **Backend Tests**: Runs tests with MongoDB and Redis
2. **Frontend Tests**: Linting, type checking, and build
3. **Security Scan**: Trivy vulnerability scanner
4. **Deploy**: Auto-deploys to Vercel and Render on push to main

---

## Security Features

✅ HTTPS only (enforced)
✅ CORS restricted to specific origins
✅ CSRF protection enabled
✅ Rate limiting (100 requests per 15 minutes)
✅ JWT authentication
✅ Secure cookie handling (httpOnly, secure, sameSite)
✅ Input sanitization (XSS, NoSQL injection)
✅ Helmet.js security headers
✅ MongoDB sanitization

---

## Monitoring

### Vercel (Frontend)
- Dashboard: https://vercel.com/dashboard
- Real-time logs and analytics
- Performance metrics
- Error tracking

### Render (Backend)
- Dashboard: https://dashboard.render.com
- Real-time logs
- Health checks
- Resource usage

### Health Check Endpoint
```bash
curl https://smart-lms-clean-1.onrender.com/health
```

---

## Updating Deployment

### Code Changes
```bash
git add .
git commit -m "your message"
git push
```

Both Vercel and Render will auto-deploy.

### Environment Variables
- **Vercel**: Update in dashboard → Redeploy
- **Render**: Update in dashboard → Service restarts automatically

### Database Migrations
```bash
# Run migrations before deploying code changes
# Add migration scripts to package.json if needed
```

---

## Production Checklist

Before going live:
- [ ] All environment variables set correctly
- [ ] MongoDB Atlas configured with IP whitelist
- [ ] Cloudinary account set up for file uploads
- [ ] Email service configured (Gmail app password)
- [ ] Payment gateways configured (if using)
- [ ] HTTPS enforced on both frontend and backend
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Health check endpoint working
- [ ] Test user registration and login
- [ ] Test file uploads
- [ ] Test all major features
- [ ] Set up monitoring/alerts
- [ ] Configure custom domain (optional)

---

## Architecture

```
┌─────────────────────────────────────┐
│   Vercel (Frontend)                 │
│   smart-lms-clean.vercel.app        │
│   - Next.js 15.5.12                 │
│   - React 18                        │
│   - Global CDN                      │
└──────────────┬──────────────────────┘
               │
               │ HTTPS + CORS
               │ API Calls
               │
┌──────────────▼──────────────────────┐
│   Render (Backend)                  │
│   smart-lms-clean-1.onrender.com    │
│   - Node.js + Express               │
│   - JWT Auth                        │
│   - Rate Limiting                   │
└──────────────┬──────────────────────┘
               │
               ├─────────────────────┐
               │                     │
┌──────────────▼──────┐  ┌──────────▼─────────┐
│   MongoDB Atlas     │  │   Cloudinary       │
│   Database          │  │   File Storage     │
└─────────────────────┘  └────────────────────┘
```

---

## Support

For issues:
1. Check browser console for errors
2. Review backend logs in Render
3. Test health endpoint
4. Verify environment variables
5. Check CORS configuration

---

## Quick Commands Reference

```bash
# Test backend health
curl https://smart-lms-clean-1.onrender.com/health

# Test CORS
curl -H "Origin: https://smart-lms-clean.vercel.app" \
     -X OPTIONS \
     https://smart-lms-clean-1.onrender.com/auth/login

# Local development
cd client && npm run dev  # Frontend on :3000
cd server && npm start    # Backend on :5000

# Build locally
cd client && npm run build
cd server && npm install

# Deploy
git push  # Auto-deploys to both services
```

---

**Status**: ✅ Deployment Configuration Complete
**Last Updated**: February 2026

🚀 Your Smart LMS is production-ready!
