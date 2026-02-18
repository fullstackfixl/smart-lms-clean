# Deploy Backend to Render

## Step 1: Push Backend to GitHub

```bash
cd server
git init
git add .
git commit -m "Prepare backend for Render deployment"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/lms-backend.git
git push -u origin main
```

## Step 2: Create Render Account
1. Go to: https://render.com
2. Sign up with GitHub (free, no credit card)

## Step 3: Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select the backend repo

## Step 4: Configure Service

**Basic Settings:**
- Name: `smart-lms-backend`
- Environment: `Node`
- Region: Choose closest to you
- Branch: `main`
- Root Directory: Leave empty (or `server` if in monorepo)
- Build Command: `npm install`
- Start Command: `npm start`

**Plan:**
- Select: `Free` (0$/month)

## Step 5: Add Environment Variables

Click "Environment" tab and add these variables from your `server/.env`:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
COOKIE_EXPIRE=7

CLIENT_URL=https://smart-lms-clean.vercel.app

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com

REDIS_URL=redis://localhost:6379
ENABLE_NOTIFICATIONS=false
```

**Important:** Copy values from your local `server/.env` file!

## Step 6: Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. You'll get a URL like: `https://smart-lms-backend.onrender.com`

## Step 7: Update Frontend

Update `client/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://smart-lms-backend.onrender.com
NEXT_PUBLIC_APP_URL=https://smart-lms-clean.vercel.app
NODE_ENV=production
```

## Step 8: Redeploy Frontend to Vercel

```bash
cd client
npm run build
vercel --prod
```

## ✅ Done!

Your app is now fully deployed:
- Frontend: https://smart-lms-clean.vercel.app
- Backend: https://smart-lms-backend.onrender.com
- Database: MongoDB Atlas

## Test Your Deployment

```bash
curl https://smart-lms-backend.onrender.com/health
```

Should return: `{"status":"ok"}`

## Important Notes:

### Free Tier Limitations:
- Spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month free (enough for 24/7)

### To Keep Always On:
- Upgrade to paid plan ($7/month)
- OR use a cron job to ping every 14 minutes

### Auto-Deploy:
- Push to GitHub → Render auto-deploys
- No manual deployment needed

## Troubleshooting:

### Build Fails:
- Check build logs in Render dashboard
- Verify all dependencies in package.json
- Check Node version compatibility

### App Crashes:
- Check runtime logs in Render dashboard
- Verify environment variables are set
- Check MongoDB connection string

### Can't Connect:
- Verify backend URL in frontend .env.production
- Check CORS settings in server/src/app.js
- Ensure Vercel URL is in allowedOrigins

## Monitor Your App:

Render Dashboard shows:
- Deployment status
- Build logs
- Runtime logs
- Metrics (CPU, Memory)
- Request count

## Next Steps:

1. Set up custom domain (optional)
2. Enable auto-deploy from GitHub
3. Set up monitoring/alerts
4. Configure backup strategy
