# Render Deployment Checklist

## ✅ Pre-Deployment (Already Done)

- [x] Backend code ready
- [x] package.json with start script
- [x] .gitignore created
- [x] render.yaml configuration
- [x] Environment variables documented

## 📋 Deployment Steps

### 1. Push to GitHub
```bash
cd server
git init
git add .
git commit -m "Initial backend commit"
git remote add origin https://github.com/YOUR-USERNAME/lms-backend.git
git push -u origin main
```

### 2. Create Render Account
- Go to: https://render.com
- Sign up with GitHub (free)

### 3. Create Web Service
- New + → Web Service
- Connect GitHub repo
- Select backend repository

### 4. Configure
- Name: `smart-lms-backend`
- Environment: `Node`
- Build: `npm install`
- Start: `npm start`
- Plan: `Free`

### 5. Add Environment Variables

Copy from `server/.env`:

| Variable | Example Value |
|----------|---------------|
| NODE_ENV | production |
| PORT | 5000 |
| MONGODB_URI | mongodb+srv://... |
| JWT_SECRET | your-secret-key |
| JWT_EXPIRE | 7d |
| CLIENT_URL | https://smart-lms-clean.vercel.app |
| CLOUDINARY_CLOUD_NAME | your-cloud-name |
| CLOUDINARY_API_KEY | your-api-key |
| CLOUDINARY_API_SECRET | your-api-secret |
| EMAIL_HOST | smtp.gmail.com |
| EMAIL_PORT | 587 |
| EMAIL_USER | your-email@gmail.com |
| EMAIL_PASS | your-app-password |
| EMAIL_FROM | your-email@gmail.com |

### 6. Deploy
- Click "Create Web Service"
- Wait 5-10 minutes
- Get URL: `https://smart-lms-backend.onrender.com`

### 7. Update Frontend
Edit `client/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://smart-lms-backend.onrender.com
```

### 8. Redeploy Frontend
```bash
cd client
vercel --prod
```

## ✅ Post-Deployment

- [ ] Test backend: `curl https://smart-lms-backend.onrender.com/health`
- [ ] Test frontend login
- [ ] Test API calls
- [ ] Verify CORS working
- [ ] Check logs in Render dashboard

## 🎯 Your URLs

- Frontend: https://smart-lms-clean.vercel.app
- Backend: https://YOUR-APP.onrender.com (after deployment)
- Database: MongoDB Atlas

## 📝 Notes

- Free tier spins down after 15 min inactivity
- First request after spin-down: 30-60 seconds
- Auto-deploys on git push
- No ngrok needed anymore!

## 🆘 If Something Goes Wrong

1. Check Render logs
2. Verify environment variables
3. Check MongoDB connection
4. Verify CORS settings
5. Test backend health endpoint

## 💡 Pro Tips

- Use Render dashboard to monitor
- Set up Slack/Discord notifications
- Enable auto-deploy from GitHub
- Consider paid plan ($7/month) for always-on
