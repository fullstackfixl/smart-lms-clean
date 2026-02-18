# Render Manual Setup - Node.js Runtime

## Problem
Render is trying to use Docker instead of Node.js runtime.

## Solution
Configure Render service manually in the dashboard.

---

## Step 1: Go to Render Dashboard
https://dashboard.render.com

---

## Step 2: Create New Web Service

1. Click "New +" button
2. Select "Web Service"
3. Connect your GitHub repository: `fullstackfixl/smart-lms-clean`
4. Click "Connect"

---

## Step 3: Configure Service Settings

### Basic Settings
- **Name**: `smart-lms-backend`
- **Region**: Choose closest to you (e.g., Oregon, Frankfurt)
- **Branch**: `main`
- **Root Directory**: `server` (IMPORTANT!)
- **Runtime**: `Node` (IMPORTANT! Not Docker)

### Build & Deploy Settings
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Plan
- **Instance Type**: `Free` (or choose paid plan)

---

## Step 4: Add Environment Variables

Click "Environment" tab and add these variables:

### Required Variables (13 total)

1. **NODE_ENV**
   ```
   production
   ```

2. **MONGODB_URI**
   ```
   mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0
   ```

3. **JWT_SECRET**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30
   ```

4. **JWT_EXPIRES_IN**
   ```
   7d
   ```

5. **CLIENT_URL**
   ```
   https://smart-lms-clean.vercel.app
   ```

6. **ENABLE_NOTIFICATIONS**
   ```
   false
   ```

7. **CLOUDINARY_CLOUD_NAME**
   ```
   dzgkmnbtj
   ```

8. **CLOUDINARY_API_KEY**
   ```
   134575579235867
   ```

9. **CLOUDINARY_API_SECRET**
   ```
   sa8LwKTRGgu2ttpqrDaedKumESE
   ```

10. **EMAIL_SERVICE**
    ```
    gmail
    ```

11. **EMAIL_USER**
    ```
    dushyant4665fixlsolution@gmail.com
    ```

12. **EMAIL_PASS**
    ```
    hdgguhrhbbjezzny
    ```

13. **EMAIL_FROM**
    ```
    dushyant4665fixlsolution@gmail.com
    ```

---

## Step 5: Deploy

1. Click "Create Web Service" button
2. Wait 5-10 minutes for deployment
3. Watch the logs for:
   - ✅ "Environment validation passed"
   - ✅ "MongoDB Connected"
   - ✅ "Smart LMS Server running on port 10000"

---

## Step 6: Get Your URL

Once deployed, you'll see:
```
https://smart-lms-backend.onrender.com
```
(or whatever name you chose)

Test it:
```bash
curl https://smart-lms-backend.onrender.com/api/health
```

---

## Step 7: Update Frontend

Edit `client/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://smart-lms-backend.onrender.com
NEXT_PUBLIC_APP_URL=https://smart-lms-clean.vercel.app
NODE_ENV=production
```

Commit and push:
```bash
git add client/.env.production
git commit -m "Update API URL to Render"
git push
```

---

## Important Notes

### Root Directory
**MUST be set to `server`** - This tells Render where your backend code is located.

### Runtime
**MUST be `Node`** - NOT Docker. Render will auto-detect Node.js from package.json.

### Port
**DO NOT set PORT variable** - Render sets this automatically (usually 10000).

### Build Command
Just `npm install` - No build step needed for Node.js/Express.

### Start Command
`npm start` - Runs `node server.js` from package.json.

---

## Troubleshooting

### Still Trying to Use Docker?
1. Delete the service completely
2. Create a new service
3. Make sure "Runtime" is set to "Node"
4. Set "Root Directory" to `server`

### Build Fails?
Check logs for specific error. Common issues:
- Missing environment variables
- Wrong root directory
- MongoDB connection issues

### App Crashes?
1. Check runtime logs
2. Verify all 13 environment variables are set
3. Check MongoDB Atlas allows connections from anywhere (0.0.0.0/0)

---

## Success Indicators

You'll know it's working when you see in logs:
```
Environment validation passed ✅
MongoDB Connected ✅
Smart LMS Server running on port 10000 ✅
```

And health check returns:
```json
{
  "success": true,
  "message": "Smart LMS API is running"
}
```

---

## After Deployment

1. ✅ Backend live on Render
2. ✅ Update frontend .env.production
3. ✅ Push to trigger Vercel redeploy
4. ✅ Test login on https://smart-lms-clean.vercel.app
5. ✅ Done!

---

## Quick Checklist

- [ ] Created new web service on Render
- [ ] Set Runtime to "Node"
- [ ] Set Root Directory to "server"
- [ ] Set Build Command to "npm install"
- [ ] Set Start Command to "npm start"
- [ ] Added all 13 environment variables
- [ ] Clicked "Create Web Service"
- [ ] Waited for deployment
- [ ] Tested health endpoint
- [ ] Updated frontend .env.production
- [ ] Pushed to GitHub
- [ ] Tested full application

---

## Need Help?

If deployment still fails, share the error from Render logs.
