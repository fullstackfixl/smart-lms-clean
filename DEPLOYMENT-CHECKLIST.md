# Complete Deployment Checklist

## Current Status
- ✅ Backend running locally on port 5000
- ✅ Frontend deployed on Vercel
- ❌ Backend deployment on Render (FAILED - needs fix)

---

## Fix Render Deployment

### Prerequisites
- [ ] Render account created
- [ ] Service created on Render
- [ ] MongoDB Atlas database accessible

### Configuration Steps

#### 1. Verify Render Service Settings
Go to Render Dashboard → Your Service → Settings

Check these settings:
- [ ] **Environment**: Node
- [ ] **Build Command**: npm install
- [ ] **Start Command**: npm start
- [ ] **Root Directory**: (leave empty or set to `server` if monorepo)

#### 2. Add Environment Variables
Go to Environment tab and add these 13 variables:

**Critical (App won't start without these):**
- [ ] MONGODB_URI
- [ ] JWT_SECRET
- [ ] JWT_EXPIRES_IN
- [ ] NODE_ENV
- [ ] CLIENT_URL
- [ ] ENABLE_NOTIFICATIONS

**File Storage:**
- [ ] CLOUDINARY_CLOUD_NAME
- [ ] CLOUDINARY_API_KEY
- [ ] CLOUDINARY_API_SECRET

**Email:**
- [ ] EMAIL_SERVICE
- [ ] EMAIL_USER
- [ ] EMAIL_PASS
- [ ] EMAIL_FROM

#### 3. Deploy
- [ ] Click "Save Changes"
- [ ] Wait for auto-deploy (5-10 minutes)
- [ ] Check logs for success messages

#### 4. Verify Deployment
- [ ] Service status shows "Live"
- [ ] Logs show "Environment validation passed"
- [ ] Logs show "MongoDB Connected"
- [ ] Logs show "Server running on port 10000"
- [ ] Health endpoint works: `curl https://your-service.onrender.com/api/health`

---

## Update Frontend Configuration

### 1. Update Environment Variables
Edit `client/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://your-service-name.onrender.com
NEXT_PUBLIC_APP_URL=https://smart-lms-clean.vercel.app
NODE_ENV=production
```

### 2. Commit and Deploy
```bash
git add client/.env.production
git commit -m "Update API URL to Render"
git push
```

### 3. Verify Vercel Deployment
- [ ] Vercel auto-deploys on push
- [ ] Check deployment logs
- [ ] Visit https://smart-lms-clean.vercel.app
- [ ] Test login functionality

---

## Final Verification

### Backend Tests
```bash
# Health check
curl https://your-service.onrender.com/api/health

# Should return:
# {"success":true,"message":"Smart LMS API is running",...}
```

### Frontend Tests
1. [ ] Open https://smart-lms-clean.vercel.app
2. [ ] Try to login
3. [ ] Check browser console for errors
4. [ ] Check Network tab - API calls should go to Render URL

### Integration Tests
- [ ] Login works
- [ ] Dashboard loads
- [ ] Course data displays
- [ ] File uploads work
- [ ] No CORS errors in console

---

## Troubleshooting

### Backend Issues

**"Exited with status 1"**
- Missing environment variables
- Check all 13 variables are added
- Verify MongoDB connection string

**"MongoDB connection failed"**
- Check MongoDB Atlas network access
- Allow all IPs: 0.0.0.0/0
- Verify connection string is correct

**"Environment validation failed"**
- Check JWT_SECRET is at least 32 characters
- Verify NODE_ENV is "production"
- Ensure MONGODB_URI is set

**Logs not showing**
- Wait 2-3 minutes after deployment
- Refresh logs page
- Check "Events" tab for deployment status

### Frontend Issues

**"Failed to fetch"**
- Backend not deployed yet
- Wrong API URL in .env.production
- CORS not configured properly

**CORS errors**
- Backend CORS doesn't include frontend URL
- Check server/src/app.js allowedOrigins array

**Login fails**
- Backend not responding
- Check Network tab for actual error
- Verify backend health endpoint works

---

## Post-Deployment

### Monitor
- [ ] Check Render logs regularly
- [ ] Monitor MongoDB Atlas metrics
- [ ] Watch Vercel deployment logs

### Optimize
- [ ] Consider upgrading Render plan (free tier spins down)
- [ ] Set up custom domain (optional)
- [ ] Enable auto-deploy from GitHub

### Security
- [ ] Rotate JWT_SECRET regularly
- [ ] Use strong passwords
- [ ] Enable 2FA on all services
- [ ] Review MongoDB access rules

---

## Quick Reference

### URLs
- Frontend: https://smart-lms-clean.vercel.app
- Backend: https://your-service-name.onrender.com
- MongoDB: MongoDB Atlas
- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard

### Important Files
- `client/.env.production` - Frontend environment variables
- `server/.env` - Backend environment variables (local only)
- `server/src/app.js` - CORS configuration
- `server/server.js` - Server entry point

### Commands
```bash
# Test backend health
curl https://your-service.onrender.com/api/health

# Deploy frontend
git push

# Check backend logs
# Go to Render Dashboard → Logs tab

# Check frontend logs
# Go to Vercel Dashboard → Deployments → View Logs
```

---

## Need Help?

If deployment fails:
1. Check Render logs for exact error
2. Verify all environment variables are set
3. Test MongoDB connection separately
4. Share error message for debugging

Common error patterns:
- "Cannot find module" → Missing dependencies, run npm install
- "Connection refused" → MongoDB not accessible
- "Invalid token" → JWT_SECRET mismatch
- "CORS error" → Frontend URL not in allowedOrigins
