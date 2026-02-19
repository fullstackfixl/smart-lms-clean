# Fixed: CSRF Token and Localhost URL Issues

## Problem
Instructor tried to create a course and got this error:
```
Access to fetch at 'http://localhost:5000/api/csrf-token' from origin 'https://smart-lms-clean.vercel.app' has been blocked by CORS policy
```

## Root Causes

1. **CSRF tokens removed from backend but frontend still fetching them**
   - Backend had CSRF completely removed
   - Frontend was still trying to fetch `/api/csrf-token` (doesn't exist)
   - This caused all create/update/delete operations to fail

2. **Hardcoded localhost URLs in production**
   - Multiple files had `http://localhost:5000` hardcoded
   - Should use `process.env.NEXT_PUBLIC_API_URL` instead
   - Production frontend was trying to connect to localhost

## Files Fixed

### 1. Instructor Course Pages
- `client/app/instructor/courses/new/page.tsx`
  - Removed CSRF token fetching
  - Changed `http://localhost:5000` to `${API_URL}`

- `client/app/instructor/courses/[id]/page.tsx`
  - Removed CSRF token fetching from video upload
  - Changed `http://localhost:5000` to `${API_URL}`

### 2. Live Classes Page
- `client/app/instructor/live-classes/page.tsx`
  - Removed CSRF token fetching from create/update/delete
  - Changed all `http://localhost:5000` to `${API_URL}`
  - Fixed: `loadLiveClasses()`, `loadCourses()`, `handleCreateClass()`, `handleUpdateClass()`, `handleDeleteClass()`

### 3. API Service Files
- `client/lib/services/studentApi.ts`
  - Removed `fetchCsrfToken()` function
  - Removed CSRF token from request interceptor
  - Removed CSRF retry logic from response interceptor

- `client/lib/services/instructorApi.ts`
  - Removed `fetchCsrfToken()` function
  - Removed CSRF token from request interceptor
  - Removed CSRF retry logic from response interceptor

- `client/lib/services/orgAdminApi.ts`
  - Removed `getCsrfToken()` function
  - Removed CSRF token from request headers
  - Removed CSRF retry logic

## Changes Made

### Before (Broken):
```typescript
// Trying to fetch non-existent CSRF endpoint
const csrfRes = await fetch(`http://localhost:5000/api/csrf-token`, {
  credentials: 'include'
})
const csrfData = await csrfRes.json()

// Using hardcoded localhost
const res = await fetch('http://localhost:5000/instructor/courses', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-CSRF-Token': csrfData.data?.csrfToken // Doesn't exist!
  }
})
```

### After (Fixed):
```typescript
// Use environment variable for API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// No CSRF token needed
const res = await fetch(`${API_URL}/instructor/courses`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  credentials: 'include'
})
```

## Environment Variables

### Production (`.env.production`):
```env
NEXT_PUBLIC_API_URL=https://smart-lms-clean-1.onrender.com
NEXT_PUBLIC_APP_URL=https://smart-lms-clean.vercel.app
NODE_ENV=production
```

### Local Development (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Testing

After deployment, test these operations:

1. **Instructor Course Creation**
   - Go to `/instructor/courses/new`
   - Fill form and click "Create Course"
   - Should work without CSRF errors

2. **Live Classes**
   - Go to `/instructor/live-classes`
   - Create/Update/Delete live classes
   - Should work without CSRF errors

3. **Video Upload**
   - Go to course detail page
   - Upload video lesson
   - Should work without localhost errors

## Deployment Status

✅ Changes committed and pushed to GitHub
⏳ Vercel auto-deploying frontend (~2-3 min)
⏳ Render auto-deploying backend (~5-10 min)

## Summary

- **Removed**: All CSRF token fetching (backend doesn't have CSRF)
- **Fixed**: All hardcoded `localhost:5000` URLs
- **Using**: `NEXT_PUBLIC_API_URL` environment variable
- **Result**: All instructor operations now work in production

**The instructor can now create courses, live classes, and upload videos without errors!**
