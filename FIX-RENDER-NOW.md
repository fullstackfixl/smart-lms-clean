# Fix Render Deployment - Step by Step

## Current Issue
Your backend is running locally on port 5000, but Render deployment shows "Failed" with "Exited with status 1".

## Root Cause
Missing environment variables in Render dashboard. The app crashes on startup because it can't connect to MongoDB or validate required environment variables.

## Fix Steps

### Step 1: Open Render Dashboard
1. Go to: https://dashboard.render.com
2. Find your service (probably named "smart-lms-backend" or similar)
3. Click on the service name

### Step 2: Check Runtime Configuration
1. Click "Settings" tab
2. Scroll to "Build & Deploy"
3. Verify these settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: Leave blank (uses latest) or set to `18.x`

If any are wrong, fix them and click "Save Changes"

### Step 3: Add Environment Variables
1. Click "Environment" tab on the left
2. Click "Add Environment Variable" button
3. Add each variable below ONE BY ONE:

#### CRITICAL Variables (App won't start without these):

```
MONGODB_URI
mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0
```

```
JWT_SECRET
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30
```

```
JWT_EXPIRES_IN
7d
```

```
NODE_ENV
production
```

```
CLIENT_URL
https://smart-lms-clean.vercel.app
```

```
ENABLE_NOTIFICATIONS
false
```

#### Cloudinary Variables (for file uploads):

```
CLOUDINARY_CLOUD_NAME
dzgkmnbtj
```

```
CLOUDINARY_API_KEY
134575579235867
```

```
CLOUDINARY_API_SECRET
sa8LwKTRGgu2ttpqrDaedKumESE
```

#### Email Variables (for sending emails):

```
EMAIL_SERVICE
gmail
```

```
EMAIL_USER
dushyant4665fixlsolution@gmail.com
```

```
EMAIL_PASS
hdgguhrhbbjezzny
```

```
EMAIL_FROM
dushyant4665fixlsolution@gmail.com
```

```
SUPPORT_EMAIL
dushyant4665fixlsolution@gmail.com
```

#### Payment Variables (optional but recommended):

```
RAZORPAY_KEY_ID
rzp_test_1234567890
```

```
RAZORPAY_KEY_SECRET
test_razorpay_secret_key_for_testing
```

```
STRIPE_SECRET_KEY
[Copy from server/.env file]
```

```
STRIPE_PUBLISHABLE_KEY
[Copy from server/.env file]
```

#### Redis Variables (set to empty to disable):

```
REDIS_URL

```
(Leave value empty)

```
ENABLE_PUSH_NOTIFICATIONS
false
```

```
ENABLE_EMAIL_NOTIFICATIONS
false
```

### Step 4: Save and Deploy
1. After adding ALL variables, click "Save Changes" at the bottom
2. Render will automatically trigger a new deployment
3. Wait 5-10 minutes for deployment to complete

### Step 5: Check Deployment Status
1. Click "Logs" tab
2. Watch for these success messages:
   - ✅ "Build successful"
   - ✅ "Environment validation passed"
   - ✅ "MongoDB Connected"
   - ✅ "Smart LMS Server running on port 10000"

### Step 6: Get Your Render URL
Once deployment succeeds, you'll see:
- **Your service URL**: `https://your-service-name.onrender.com`
- Copy this URL (you'll need it for the next step)

### Step 7: Test Backend
Open your browser or use curl:
```bash
curl https://your-service-name.onrender.com/api/health
```

Should return:
```json
{
  "success": true,
  "message": "Smart LMS API is running",
  "data": {
    "timestamp": "...",
    "environment": "production",
    "uptime": 123
  }
}
```

### Step 8: Update Frontend Configuration
Once backend is working, update your frontend:

1. Open `client/.env.production`
2. Replace ngrok URL with Render URL:
```env
NEXT_PUBLIC_API_URL=https://your-service-name.onrender.com
NEXT_PUBLIC_APP_URL=https://smart-lms-clean.vercel.app
NODE_ENV=production
```

3. Commit and push to trigger Vercel redeploy:
```bash
git add client/.env.production
git commit -m "Update API URL to Render"
git push
```

### Step 9: Update Backend CORS
Update `server/src/app.js` to include Render URL in CORS:

Find the `allowedOrigins` array and add your Render URL:
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL || 'http://localhost:3000',
  'https://smart-lms-clean.vercel.app',
  'https://your-service-name.onrender.com', // Add this line
  ''
];
```

Then commit and push to trigger Render redeploy.

## Common Issues & Solutions

### Issue: "Exited with status 1"
**Solution**: Missing environment variables. Add all CRITICAL variables from Step 3.

### Issue: "MongoDB connection failed"
**Solution**: Check MONGODB_URI is correct. Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0).

### Issue: "Environment validation failed"
**Solution**: Add JWT_SECRET, JWT_EXPIRES_IN, and NODE_ENV.

### Issue: Logs show "Redis connection failed"
**Solution**: Set `ENABLE_NOTIFICATIONS=false` and `REDIS_URL=` (empty).

### Issue: Build succeeds but app crashes
**Solution**: Check runtime logs for specific error. Usually missing env vars.

### Issue: "Port already in use"
**Solution**: Don't set PORT variable in Render. Render sets it automatically.

## Verification Checklist

- [ ] Render service uses Node runtime (not Docker)
- [ ] All CRITICAL env vars added
- [ ] Clicked "Save Changes"
- [ ] Deployment shows "Live" status
- [ ] Logs show "Server running on port 10000"
- [ ] Health endpoint returns success
- [ ] Frontend .env.production updated with Render URL
- [ ] Backend CORS includes Render URL
- [ ] Frontend redeployed to Vercel

## After Successful Deployment

Your app will be fully deployed:
- ✅ Frontend: https://smart-lms-clean.vercel.app
- ✅ Backend: https://your-service-name.onrender.com
- ✅ Database: MongoDB Atlas

### Important Notes:
- Free tier spins down after 15 min inactivity
- First request after spin-down takes 30-60 seconds
- Render auto-deploys on every git push

## Need Help?

If deployment still fails:
1. Go to Render dashboard → Logs tab
2. Copy the error message
3. Share it so I can help debug

## Quick Test Commands

Test backend health:
```bash
curl https://your-service-name.onrender.com/api/health
```

Test frontend connection:
```bash
# Open browser console on https://smart-lms-clean.vercel.app
# Try to login - check Network tab for API calls
```
