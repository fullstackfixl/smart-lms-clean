# Deployment Test Checklist

## Current Status
- ✅ Frontend: https://smart-lms-clean.vercel.app
- ✅ Backend: https://smart-lms-clean-1.onrender.com
- 🔄 Waiting for deployments to complete

## Fixes Applied

### 1. Frontend API URL Fix
- **Issue**: Hardcoded `localhost:5000` in `client/lib/api.ts`
- **Fix**: Changed to use `process.env.NEXT_PUBLIC_API_URL`
- **File**: `client/lib/api.ts`

### 2. Double Slash URL Fix
- **Issue**: URL had double slash `//auth/login`
- **Fix**: Added `.replace(/\/$/, '')` to remove trailing slashes
- **File**: `client/lib/api.ts`

### 3. CSRF Protection Fix
- **Issue**: CSRF middleware blocking auth endpoints
- **Fix 1**: Added skip logic for auth endpoints in CSRF middleware
- **Fix 2**: Removed global CSRF from root path `/`
- **Files**: 
  - `server/src/middleware/csrf.js`
  - `server/src/app.js`
  - `server/src/routes/liveClassesSimple.js`

## Test Plan

### After Deployments Complete (Wait 2-3 minutes)

#### Test 1: Backend Health Check
```bash
curl https://smart-lms-clean-1.onrender.com/api/health
```
**Expected**: `{"success":true,"message":"Smart LMS API is running"}`

#### Test 2: CORS Check
```bash
curl -H "Origin: https://smart-lms-clean.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://smart-lms-clean-1.onrender.com/auth/login
```
**Expected**: CORS headers allowing the origin

#### Test 3: Frontend Login
1. Go to https://smart-lms-clean.vercel.app
2. Click "Login"
3. Enter credentials
4. Click "Sign In"

**Expected**: 
- No CORS errors
- No CSRF errors
- No 404 errors
- Login succeeds or shows proper validation errors

#### Test 4: Frontend Register
1. Go to https://smart-lms-clean.vercel.app
2. Click "Register"
3. Fill in registration form
4. Submit

**Expected**:
- No CORS errors
- No CSRF errors
- Registration flow works

## Common Issues & Solutions

### Issue: Still getting CORS error
**Solution**: 
1. Check Render environment variables
2. Add `CLIENT_URL=https://smart-lms-clean.vercel.app` in Render dashboard
3. Wait for Render to redeploy

### Issue: Still getting CSRF error
**Solution**:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check Render logs for CSRF skip messages

### Issue: 404 Not Found
**Solution**:
1. Check URL in browser console (should not have `//`)
2. Verify Vercel deployed latest code
3. Check Vercel deployment logs

## Verification Commands

### Check Vercel Deployment
```bash
# Check latest deployment
# Go to: https://vercel.com/dashboard
```

### Check Render Deployment
```bash
# Check latest deployment
# Go to: https://dashboard.render.com
```

### Check Frontend Environment Variables
```bash
# In Vercel dashboard, check:
# - NEXT_PUBLIC_API_URL = https://smart-lms-clean-1.onrender.com
# - NEXT_PUBLIC_APP_URL = https://smart-lms-clean.vercel.app
```

### Check Backend Environment Variables
```bash
# In Render dashboard, check:
# - CLIENT_URL = https://smart-lms-clean.vercel.app (ADD THIS IF MISSING!)
# - NODE_ENV = production
# - All other env vars from .env.example
```

## Timeline

1. **Now**: Code pushed to GitHub
2. **+1 min**: Vercel starts building
3. **+2 min**: Vercel deployment complete
4. **+2 min**: Render starts building
5. **+4 min**: Render deployment complete
6. **+5 min**: Test login/register

## Success Criteria

✅ Backend health check returns 200 OK
✅ CORS headers present in OPTIONS request
✅ Login page loads without errors
✅ Login form submits without CORS/CSRF errors
✅ Register form submits without CORS/CSRF errors
✅ No double slashes in URLs
✅ No 404 errors on auth endpoints

## Next Steps After Success

1. Test other protected endpoints
2. Test instructor/admin dashboards
3. Test course creation
4. Test file uploads
5. Full end-to-end testing

## Rollback Plan (If Issues Persist)

If issues continue after 5 minutes:

1. Check Render logs: https://dashboard.render.com → smart-lms-clean-1 → Logs
2. Check Vercel logs: https://vercel.com/dashboard → smart-lms-clean → Deployments
3. Verify environment variables in both platforms
4. Contact support if infrastructure issues

## Contact

- Frontend: https://smart-lms-clean.vercel.app
- Backend: https://smart-lms-clean-1.onrender.com
- GitHub: https://github.com/fullstackfixl/smart-lms-clean
