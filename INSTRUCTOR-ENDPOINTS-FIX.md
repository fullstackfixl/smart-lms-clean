# Instructor Endpoints Fix

## Issue
Instructor dashboard and pages were using hardcoded `localhost:5000` URLs instead of environment variables.

## Solution Applied

### 1. Created API Config Utility
**File**: `client/lib/config.ts`
```typescript
export const getApiUrl = (): string => {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')
}

export const API_URL = getApiUrl()
```

### 2. Fixed Files
- ✅ `client/app/instructor/dashboard/page.tsx` - Dashboard overview
- ✅ `client/app/instructor/upload/page.tsx` - Video upload
- ✅ `client/app/instructor/notifications/page.tsx` - Notifications

### 3. Remaining Files to Fix
- ⏳ `client/app/instructor/live-classes/page.tsx` - Multiple fetch calls
- ⏳ `client/app/instructor/courses/new/page.tsx` - Course creation
- ⏳ `client/app/instructor/courses/page.tsx` - Course list
- ⏳ `client/app/instructor/courses/[id]/page.tsx` - Course details

## Backend Endpoints Available

### Dashboard
- `GET /instructor/dashboard/overview` - Dashboard stats

### Courses
- `POST /instructor/courses` - Create course
- `GET /instructor/courses` - List courses
- `GET /instructor/courses/:id` - Get course details
- `PUT /instructor/courses/:id` - Update course
- `DELETE /instructor/courses/:id` - Delete course
- `PATCH /instructor/courses/:id/publish` - Publish course

### Modules/Sections
- `POST /instructor/courses/:courseId/modules` - Create module
- `GET /instructor/courses/:courseId/sections` - Get sections
- `PUT /instructor/modules/:id` - Update module
- `DELETE /instructor/modules/:id` - Delete module

### Lessons
- `POST /instructor/modules/:moduleId/lessons` - Create lesson
- `GET /instructor/sections/:sectionId/lessons` - Get lessons
- `PUT /instructor/lessons/:id` - Update lesson
- `DELETE /instructor/lessons/:id` - Delete lesson

### Quizzes
- `POST /instructor/courses/:courseId/quizzes` - Create quiz
- `PUT /instructor/quizzes/:id` - Update quiz
- `DELETE /instructor/quizzes/:id` - Delete quiz

### Students & Analytics
- `GET /instructor/courses/:id/students` - Get course students
- `GET /instructor/courses/:id/analytics` - Get course analytics

### Announcements
- `POST /instructor/courses/:id/announcements` - Create announcement
- `GET /instructor/courses/:id/announcements` - Get announcements
- `DELETE /instructor/announcements/:id` - Delete announcement

### Submissions
- `GET /instructor/submissions` - Get submissions
- `PATCH /instructor/submissions/:id/grade` - Grade submission

### Notifications
- `GET /instructor/notifications` - Get notifications
- `PATCH /instructor/notifications/:id/read` - Mark as read
- `PATCH /instructor/notifications/read-all` - Mark all as read
- `DELETE /instructor/notifications/:id` - Delete notification

### Live Classes
- `POST /instructor/live-classes` - Schedule class
- `GET /instructor/live-classes` - Get classes
- `PATCH /instructor/live-classes/:id` - Update class
- `DELETE /instructor/live-classes/:id` - Cancel class

## Testing Checklist

After deployment:

1. ✅ Login as instructor
2. ✅ Dashboard loads with stats
3. ⏳ View courses list
4. ⏳ Create new course
5. ⏳ Edit course
6. ⏳ Upload video
7. ⏳ Schedule live class
8. ⏳ View notifications
9. ⏳ View submissions
10. ⏳ View students

## Next Steps

1. Fix remaining instructor pages with hardcoded URLs
2. Test all endpoints after Vercel deployment
3. Verify CSRF tokens work for POST/PATCH/DELETE requests
4. Check authorization and organization isolation

## Environment Variables Required

### Vercel (Frontend)
- `NEXT_PUBLIC_API_URL` = `https://smart-lms-clean-1.onrender.com`
- `NEXT_PUBLIC_APP_URL` = `https://smart-lms-clean.vercel.app`

### Render (Backend)
- `CLIENT_URL` = `https://smart-lms-clean.vercel.app`
- `NODE_ENV` = `production`
- All other vars from `.env.example`
