# Render Environment Variables Setup

## Required Environment Variables

Copy these from your `server/.env` file to Render dashboard:

### 1. Server Configuration
```
NODE_ENV=production
PORT=10000
```

### 2. Database (CRITICAL - Must have!)
```
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/database?retryWrites=true&w=majority
```
**Get this from your MongoDB Atlas dashboard**

### 3. JWT Configuration (CRITICAL - Must have!)
```
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
```

### 4. Client URL
```
CLIENT_URL=https://smart-lms-clean.vercel.app
```

### 5. Cloudinary (for file uploads)
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 6. Email Configuration
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=your_email@gmail.com
```

### 7. Disable Redis/Notifications (Important for free tier!)
```
ENABLE_NOTIFICATIONS=false
REDIS_URL=
```

## How to Add in Render:

1. Go to your service dashboard
2. Click "Environment" tab
3. Click "Add Environment Variable"
4. Add each variable one by one
5. Click "Save Changes"
6. Render will auto-redeploy

## Common Issues:

### Deployment Fails:
- **Missing MONGODB_URI**: Add your MongoDB connection string
- **Missing JWT_SECRET**: Add a secret key (min 32 characters)
- **Redis error**: Set `ENABLE_NOTIFICATIONS=false`

### App Crashes:
- Check logs for specific error
- Verify all CRITICAL variables are set
- Ensure MongoDB connection string is correct

## Test After Deployment:

```bash
curl https://your-app.onrender.com/health
```

Should return: `{"status":"ok"}`

## Your Current Values:

Check `server/.env` file for your actual values!

**DO NOT commit .env to GitHub!**
