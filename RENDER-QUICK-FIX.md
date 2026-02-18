# Render Deployment - Quick Fix

## Problem
Backend deployment showing "Failed" with "Exited with status 1"

## Solution
Missing environment variables. Follow these exact steps:

---

## Step 1: Open Render Dashboard
Go to: https://dashboard.render.com

Find your service and click on it.

---

## Step 2: Add Environment Variables

Click "Environment" tab → "Add Environment Variable"

Copy-paste these EXACTLY (one at a time):

### Variable 1: MONGODB_URI
```
mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0
```

### Variable 2: JWT_SECRET
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30
```

### Variable 3: JWT_EXPIRES_IN
```
7d
```

### Variable 4: NODE_ENV
```
production
```

### Variable 5: CLIENT_URL
```
https://smart-lms-clean.vercel.app
```

### Variable 6: ENABLE_NOTIFICATIONS
```
false
```

### Variable 7: CLOUDINARY_CLOUD_NAME
```
dzgkmnbtj
```

### Variable 8: CLOUDINARY_API_KEY
```
134575579235867
```

### Variable 9: CLOUDINARY_API_SECRET
```
sa8LwKTRGgu2ttpqrDaedKumESE
```

### Variable 10: EMAIL_SERVICE
```
gmail
```

### Variable 11: EMAIL_USER
```
dushyant4665fixlsolution@gmail.com
```

### Variable 12: EMAIL_PASS
```
hdgguhrhbbjezzny
```

### Variable 13: EMAIL_FROM
```
dushyant4665fixlsolution@gmail.com
```

---

## Step 3: Save and Wait

1. Click "Save Changes" at the bottom
2. Render will auto-deploy (takes 5-10 minutes)
3. Watch the "Logs" tab for progress

---

## Step 4: Check Success

Look for these in logs:
- ✅ "Environment validation passed"
- ✅ "MongoDB Connected"
- ✅ "Smart LMS Server running on port 10000"

---

## Step 5: Get Your URL

Once "Live", copy your service URL:
```
https://your-service-name.onrender.com
```

Test it:
```bash
curl https://your-service-name.onrender.com/api/health
```

Should return JSON with `"success": true`

---

## Step 6: Update Frontend

Edit `client/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://your-service-name.onrender.com
NEXT_PUBLIC_APP_URL=https://smart-lms-clean.vercel.app
NODE_ENV=production
```

Commit and push to redeploy Vercel:
```bash
git add client/.env.production
git commit -m "Update API URL to Render"
git push
```

---

## Done! 🎉

Your app is now fully deployed:
- Frontend: https://smart-lms-clean.vercel.app
- Backend: https://your-service-name.onrender.com

---

## Still Failing?

Check Render logs for the exact error and share it.

Common issues:
- MongoDB connection: Check MongoDB Atlas allows all IPs (0.0.0.0/0)
- Missing variables: Double-check all 13 variables are added
- Wrong runtime: Ensure "Environment" is set to "Node" not "Docker"
