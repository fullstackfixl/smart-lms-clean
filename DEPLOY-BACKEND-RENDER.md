# Deploy Backend to Render (Free, Permanent Solution)

## Why Render?
- Free tier available
- No credit card needed
- Always online (no ngrok needed)
- Auto-deploys from GitHub

## Steps:

### 1. Push Backend to GitHub
```bash
cd server
git init
git add .
git commit -m "Initial backend commit"
git remote add origin https://github.com/YOUR-USERNAME/lms-backend.git
git push -u origin main
```

### 2. Create Render Account
Go to: https://render.com
Sign up (free, no credit card)

### 3. Create New Web Service
- Click "New +"
- Select "Web Service"
- Connect GitHub repository
- Select your backend repo

### 4. Configure Service
```
Name: smart-lms-backend
Environment: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

### 5. Add Environment Variables
Click "Environment" tab, add:
```
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
CLIENT_URL=https://smart-lms-clean.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

Copy from your `server/.env` file

### 6. Deploy
Click "Create Web Service"
Wait 5-10 minutes for deployment

### 7. Get Backend URL
After deployment, you'll get:
`https://smart-lms-backend.onrender.com`

### 8. Update Vercel Environment Variable
Go to: https://vercel.com/your-project/settings/environment-variables

Update:
- Name: `NEXT_PUBLIC_API_URL`
- Value: `https://smart-lms-backend.onrender.com`
- Environment: Production ✓

### 9. Redeploy Vercel
```bash
cd client
vercel --prod
```

## ✅ Done!

Now your app is fully deployed:
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

No ngrok needed!

## Free Tier Limits:
- Spins down after 15 min of inactivity
- First request after spin-down takes 30-60 seconds
- Upgrade to paid ($7/month) for always-on

## Alternative Free Hosts:
- Railway: https://railway.app
- Fly.io: https://fly.io
- Cyclic: https://cyclic.sh
