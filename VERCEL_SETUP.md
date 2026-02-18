# Vercel Environment Variables Setup

## Quick Setup Guide

### Step 1: Access Vercel Dashboard
1. Go to https://vercel.com
2. Select your project: `smart-lms-clean`
3. Click on "Settings" tab
4. Click on "Environment Variables" in the left sidebar

### Step 2: Add Environment Variables

Add these two variables:

#### Variable 1: API URL
```
Name: NEXT_PUBLIC_API_URL
Value: https://smart-lms-clean-1.onrender.com
Environment: Production, Preview, Development (select all)
```

#### Variable 2: App URL
```
Name: NEXT_PUBLIC_APP_URL
Value: https://smart-lms-clean.vercel.app
Environment: Production, Preview, Development (select all)
```

### Step 3: Redeploy

After adding the variables, you MUST redeploy for changes to take effect:

**Option A: Via Dashboard**
1. Go to "Deployments" tab
2. Click the three dots (...) on the latest deployment
3. Click "Redeploy"
4. Confirm the redeployment

**Option B: Via Git Push**
```bash
git add .
git commit -m "feat: configure production API URL"
git push
```

Vercel will automatically redeploy.

### Step 4: Verify

1. Wait for deployment to complete (usually 1-2 minutes)
2. Visit: https://smart-lms-clean.vercel.app
3. Open browser console (F12)
4. Check Network tab
5. Verify API calls go to: `https://smart-lms-clean-1.onrender.com`

## Expected Behavior

### Before Configuration
- API calls go to: `http://localhost:5000` ❌
- CORS errors in console ❌
- Login fails ❌

### After Configuration
- API calls go to: `https://smart-lms-clean-1.onrender.com` ✅
- No CORS errors ✅
- Login works ✅

## Troubleshooting

### Issue: Still calling localhost
**Solution**: Redeploy is required. Environment variables only apply to new builds.

### Issue: CORS errors
**Solution**: 
1. Check backend is running: `curl https://smart-lms-clean-1.onrender.com/health`
2. Verify backend `.env` has: `CLIENT_URL=https://smart-lms-clean.vercel.app`
3. Restart backend service in Render

### Issue: 404 errors
**Solution**:
1. Verify API URL is correct (no trailing slash)
2. Check endpoint paths in browser network tab
3. Test endpoint directly: `curl https://smart-lms-clean-1.onrender.com/health`

## CLI Method (Alternative)

If you prefer using Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Add environment variables
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://smart-lms-clean-1.onrender.com

vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://smart-lms-clean.vercel.app

# Redeploy
vercel --prod
```

## Verification Checklist

- [ ] Environment variables added in Vercel dashboard
- [ ] Both variables set for all environments (Production, Preview, Development)
- [ ] Redeployment triggered
- [ ] Deployment completed successfully
- [ ] Frontend loads without errors
- [ ] API calls go to correct backend URL
- [ ] No CORS errors in console
- [ ] Login functionality works
- [ ] Can navigate through the app

## Next Steps

After Vercel is configured:
1. Test user registration
2. Test login
3. Test instructor features
4. Test student features
5. Monitor logs for any errors

## Support

If issues persist after following this guide:
1. Check `DEPLOYMENT_CONNECTION_GUIDE.md` for detailed troubleshooting
2. Review browser console for specific errors
3. Check Vercel deployment logs
4. Verify backend is accessible

---

**Important**: Environment variables require a rebuild. Always redeploy after adding/changing variables!
