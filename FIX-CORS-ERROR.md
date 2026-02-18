# Fix CORS Error - "Failed to fetch"

## Problem
Frontend can't connect to backend due to CORS error.

## Root Cause
Render backend doesn't have `CLIENT_URL` environment variable set, so it's blocking requests from Vercel.

---

## Solution: Add CLIENT_URL to Render

### Step 1: Go to Render Dashboard
https://dashboard.render.com

### Step 2: Open Your Service
Click on `smart-lms-clean-1` (or your service name)

### Step 3: Go to Environment Tab
Click "Environment" in the left sidebar

### Step 4: Add CLIENT_URL Variable
Click "Add Environment Variable"

**Key**: `CLIENT_URL`
**Value**: `https://smart-lms-clean.vercel.app`

### Step 5: Save
Click "Save Changes"

Render will automatically redeploy (takes 2-3 minutes)

---

## Verify Fix

### Test Backend CORS
```bash
curl -H "Origin: https://smart-lms-clean.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://smart-lms-clean-1.onrender.com/auth/login
```

Should return CORS headers allowing the origin.

### Test Frontend
1. Go to https://smart-lms-clean.vercel.app
2. Try to login
3. Should work now!

---

## Current Status

✅ **Backend**: Running on https://smart-lms-clean-1.onrender.com
✅ **Frontend**: Deployed on https://smart-lms-clean.vercel.app
✅ **Frontend Config**: Points to correct backend URL
❌ **Backend CORS**: Missing CLIENT_URL variable

---

## After Adding CLIENT_URL

The backend CORS will allow:
- http://localhost:3000 (local dev)
- https://smart-lms-clean.vercel.app (production)
- https://smart-lms-clean-1.onrender.com (backend itself)
- https://smart-lms-clean-*.vercel.app (preview deployments)

---

## Alternative: Manual CORS Test

If you want to verify CORS is the issue:

1. Open browser console on https://smart-lms-clean.vercel.app
2. Run this:
```javascript
fetch('https://smart-lms-clean-1.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

If you see CORS error, it confirms the issue.

---

## Complete Environment Variables Checklist

Make sure Render has ALL these variables:

- [x] MONGODB_URI
- [x] JWT_SECRET
- [x] JWT_EXPIRES_IN
- [x] NODE_ENV
- [ ] **CLIENT_URL** ← ADD THIS!
- [x] ENABLE_NOTIFICATIONS
- [x] CLOUDINARY_CLOUD_NAME
- [x] CLOUDINARY_API_KEY
- [x] CLOUDINARY_API_SECRET
- [x] EMAIL_SERVICE
- [x] EMAIL_USER
- [x] EMAIL_PASS
- [x] EMAIL_FROM

---

## Quick Fix Summary

1. Go to Render dashboard
2. Click your service
3. Click "Environment"
4. Add: `CLIENT_URL` = `https://smart-lms-clean.vercel.app`
5. Click "Save Changes"
6. Wait 2-3 minutes
7. Test login on frontend
8. Done!
