# Frontend-Backend Connection Guide

## Deployment URLs
- **Frontend (Vercel)**: https://smart-lms-clean.vercel.app
- **Backend (Render)**: https://smart-lms-clean-1.onrender.com

## Configuration Changes Made

### 1. Backend CORS Configuration (`server/src/app.js`)
Updated to allow requests from Vercel frontend:
```javascript
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3001',
  'https://smart-lms-clean.vercel.app', // Production frontend
  'https://smart-lms-clean-*.vercel.app' // Vercel preview deployments
];
```

### 2. Backend Environment (`server/.env`)
Updated CLIENT_URL:
```env
CLIENT_URL=https://smart-lms-clean.vercel.app
```

### 3. Frontend Environment (`client/.env.production`)
Created production environment file:
```env
NEXT_PUBLIC_API_URL=https://smart-lms-clean-1.onrender.com
NEXT_PUBLIC_APP_URL=https://smart-lms-clean.vercel.app
```

### 4. Frontend Configuration (`client/lib/config.ts`)
Created centralized configuration file for API endpoints.

## Vercel Environment Variables

You need to set these in your Vercel project settings:

1. Go to: https://vercel.com/your-project/settings/environment-variables

2. Add the following variables:

```
NEXT_PUBLIC_API_URL=https://smart-lms-clean-1.onrender.com
NEXT_PUBLIC_APP_URL=https://smart-lms-clean.vercel.app
```

## Render Environment Variables

Ensure these are set in your Render service:

```
CLIENT_URL=https://smart-lms-clean.vercel.app
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
NODE_ENV=production
```

## Testing the Connection

### 1. Test Backend Health
```bash
curl https://smart-lms-clean-1.onrender.com/health
```

Expected response:
```json
{
  "success": true,
  "message": "Smart LMS API is running",
  "data": {
    "timestamp": "2026-02-18T...",
    "environment": "production",
    "uptime": 123.45
  }
}
```

### 2. Test CORS
```bash
curl -H "Origin: https://smart-lms-clean.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://smart-lms-clean-1.onrender.com/auth/login
```

Should return CORS headers allowing the origin.

### 3. Test Frontend Connection
1. Visit: https://smart-lms-clean.vercel.app
2. Open browser console (F12)
3. Check for API calls to `https://smart-lms-clean-1.onrender.com`
4. Verify no CORS errors

## Common Issues & Solutions

### Issue 1: CORS Errors
**Symptom**: Browser console shows "CORS policy" errors

**Solution**:
1. Verify `CLIENT_URL` in backend `.env` matches frontend URL
2. Redeploy backend after changing environment variables
3. Clear browser cache

### Issue 2: API URL Not Updated
**Symptom**: Frontend still calling `localhost:5000`

**Solution**:
1. Verify `NEXT_PUBLIC_API_URL` is set in Vercel
2. Redeploy frontend (environment variables require rebuild)
3. Check browser network tab for actual URLs being called

### Issue 3: 404 Errors
**Symptom**: API endpoints return 404

**Solution**:
1. Verify backend is running: `curl https://smart-lms-clean-1.onrender.com/health`
2. Check endpoint paths match between frontend and backend
3. Review backend logs in Render dashboard

### Issue 4: Authentication Fails
**Symptom**: Login works but subsequent requests fail

**Solution**:
1. Verify cookies are being sent with `credentials: 'include'`
2. Check CORS allows credentials
3. Ensure JWT_SECRET is set in backend environment

## Deployment Checklist

### Backend (Render)
- [ ] Environment variables set
- [ ] CORS configured for Vercel domain
- [ ] Health endpoint accessible
- [ ] MongoDB connection working
- [ ] Logs show no errors

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_URL` environment variable set
- [ ] Build successful
- [ ] No console errors on homepage
- [ ] API calls going to correct backend URL
- [ ] Authentication flow working

## Monitoring

### Backend Logs (Render)
```bash
# View in Render dashboard or use CLI
render logs -s your-service-name
```

### Frontend Logs (Vercel)
```bash
# View in Vercel dashboard or use CLI
vercel logs your-deployment-url
```

## Security Considerations

1. **HTTPS Only**: Both frontend and backend use HTTPS
2. **CORS Restricted**: Only allows specific origins
3. **Credentials**: Cookies sent only to same domain
4. **CSRF Protection**: Enabled on backend
5. **Rate Limiting**: Prevents abuse

## Performance Optimization

1. **CDN**: Vercel provides global CDN for frontend
2. **Caching**: API responses cached where appropriate
3. **Compression**: Enabled on both frontend and backend
4. **Connection Pooling**: MongoDB connection pooling enabled

## Next Steps

1. **Set Vercel Environment Variables**
   - Go to Vercel dashboard
   - Add `NEXT_PUBLIC_API_URL`
   - Redeploy

2. **Verify Backend Environment**
   - Check Render dashboard
   - Ensure `CLIENT_URL` is set
   - Restart service if needed

3. **Test End-to-End**
   - Register a new user
   - Login
   - Navigate through app
   - Check all API calls work

4. **Monitor**
   - Watch logs for errors
   - Check performance metrics
   - Set up alerts for downtime

## Support

If issues persist:
1. Check browser console for errors
2. Review backend logs in Render
3. Verify all environment variables are set
4. Test API endpoints directly with curl/Postman
5. Check network tab in browser dev tools

## Files Modified

- `server/src/app.js` - CORS configuration
- `server/.env` - CLIENT_URL updated
- `client/.env.production` - Created with production API URL
- `client/lib/config.ts` - Created centralized config
- Multiple frontend pages - Updated hardcoded URLs

## Rollback Plan

If deployment fails:
1. Revert `server/src/app.js` CORS changes
2. Set `CLIENT_URL=http://localhost:3000` in backend
3. Remove `NEXT_PUBLIC_API_URL` from Vercel
4. Redeploy both services

---

**Last Updated**: 2026-02-18
**Status**: Ready for deployment
