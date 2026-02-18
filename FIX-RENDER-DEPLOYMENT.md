# Fix Render Deployment - Quick Guide

## Problem: Deployment Failed

Your deployment is failing because of missing environment variables.

## Solution: Add Environment Variables

### Step 1: Go to Render Dashboard
1. Open your service: https://dashboard.render.com
2. Click on your service name
3. Click "Environment" tab on the left

### Step 2: Add These CRITICAL Variables

**From your `server/.env` file, copy these:**

1. **MONGODB_URI** (MOST IMPORTANT!)
   - Value: `mongodb+srv://...` (your full MongoDB connection string)

2. **JWT_SECRET**
   - Value: Your JWT secret (min 32 characters)

3. **JWT_EXPIRES_IN**
   - Value: `7d`

4. **JWT_COOKIE_EXPIRES_IN**
   - Value: `7`

5. **CLIENT_URL**
   - Value: `https://smart-lms-clean.vercel.app`

6. **ENABLE_NOTIFICATIONS**
   - Value: `false`

7. **CLOUDINARY_CLOUD_NAME**
   - Value: Your cloudinary cloud name

8. **CLOUDINARY_API_KEY**
   - Value: Your cloudinary API key

9. **CLOUDINARY_API_SECRET**
   - Value: Your cloudinary API secret

10. **EMAIL_HOST**
    - Value: `smtp.gmail.com`

11. **EMAIL_PORT**
    - Value: `587`

12. **EMAIL_USER**
    - Value: Your email

13. **EMAIL_PASS**
    - Value: Your email app password

14. **EMAIL_FROM**
    - Value: Your email

### Step 3: Save and Redeploy

1. Click "Save Changes" at the bottom
2. Render will automatically redeploy
3. Wait 5-10 minutes
4. Check logs for success

## How to Find Your Values:

### MongoDB URI:
1. Go to MongoDB Atlas
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password

### JWT Secret:
- Use your current one from `server/.env`
- OR generate new: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Cloudinary:
- Go to Cloudinary dashboard
- Copy Cloud Name, API Key, API Secret

### Email:
- Use Gmail
- Create App Password: https://myaccount.google.com/apppasswords

## After Adding Variables:

1. Go to "Logs" tab
2. Watch for:
   - "Environment validation passed" ✅
   - "MongoDB Connected" ✅
   - "Server running on port 10000" ✅

3. Test:
```bash
curl https://your-app.onrender.com/health
```

## Still Failing?

Share the error from Render logs and I'll help fix it!

## Quick Checklist:

- [ ] MONGODB_URI added
- [ ] JWT_SECRET added (min 32 chars)
- [ ] JWT_EXPIRES_IN = 7d
- [ ] CLIENT_URL = https://smart-lms-clean.vercel.app
- [ ] ENABLE_NOTIFICATIONS = false
- [ ] All Cloudinary vars added
- [ ] All Email vars added
- [ ] Clicked "Save Changes"
- [ ] Waited for redeploy
- [ ] Checked logs

If all checked, it should work!
