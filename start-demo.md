# 🎯 Demo Setup - Complete Checklist

## Pre-Demo Setup (Do this BEFORE your meeting)

### Step 1: Start Backend
```bash
cd server
npm start
```
✅ Should see: "Server running on port 5000" and "MongoDB connected"

### Step 2: Start ngrok
```bash
ngrok http 5000
```
✅ Copy the HTTPS URL (looks like: `https://abc123.ngrok-free.app`)

### Step 3: Update Environment Files

**File: `client/.env.production`**
```env
NEXT_PUBLIC_API_URL=https://YOUR-NGROK-URL-HERE.ngrok-free.app
NEXT_PUBLIC_APP_URL=https://smart-lms-clean.vercel.app
NODE_ENV=production
```

**File: `server/src/app.js`**
Add your ngrok URL to the allowedOrigins array:
```javascript
const allowedOrigins = [
  'https://smart-lms-clean.vercel.app',
  'http://localhost:3000',
  'https://YOUR-NGROK-URL-HERE.ngrok-free.app', // Add this line
];
```

### Step 4: Restart Backend
Press Ctrl+C in the backend terminal, then:
```bash
npm start
```

### Step 5: Build Frontend
```bash
cd client
npm run build
```
✅ Should complete with 0 errors (warnings are OK)

### Step 6: Deploy to Vercel
```bash
vercel --prod
```
Or push to GitHub and Vercel will auto-deploy.

---

## 🧪 Test Before Demo

### Test 1: Backend Health Check
Open browser: `https://YOUR-NGROK-URL.ngrok-free.app/health`
✅ Should return: `{"status":"ok"}`

### Test 2: Login as Instructor
1. Go to: https://smart-lms-clean.vercel.app/login
2. Email: `instructor@test.com`
3. Password: `password123`
4. ✅ Should redirect to instructor dashboard with real data

### Test 3: Create a Course
1. Click "Courses" in sidebar
2. Click "Create Course"
3. Fill form and submit
4. ✅ Course should appear in list

### Test 4: Schedule Live Class
1. Click "Live Classes" in sidebar
2. Click "Schedule Class"
3. Fill form (meeting URL auto-generated)
4. ✅ All students receive email with Jitsi link

### Test 5: Student View
1. Logout
2. Login as: `student1@test.com` / `password123`
3. ✅ See courses from same organization
4. ✅ Can enroll and view course content

---

## 🎬 Demo Script

### 1. Show Login (30 seconds)
- "This is our multi-tenant LMS platform"
- Login as instructor
- "Authentication with JWT tokens"

### 2. Instructor Dashboard (1 minute)
- "Real-time data from MongoDB"
- Show: Total courses, students, completion rates
- "All data is organization-scoped for multi-tenancy"

### 3. Create Course (2 minutes)
- Click "Create Course"
- Fill: Title, Description, Category, Level
- "Courses are automatically visible to students in same organization"

### 4. Add Course Content (2 minutes)
- Click on created course
- Add Module: "Introduction"
- Add Lesson: "Getting Started"
- Upload video (Cloudinary integration)
- "Video processing and CDN delivery"

### 5. Schedule Live Class (1 minute)
- Go to "Live Classes"
- Schedule new class
- "Automatically generates Jitsi meeting room"
- "Sends email to ALL students in organization"

### 6. Student Experience (2 minutes)
- Logout, login as student
- Show course catalog (organization-filtered)
- Enroll in course
- View course content
- "Students can track progress and complete lessons"

### 7. Multi-Tenancy (1 minute)
- "Each organization is completely isolated"
- "Students only see courses from their organization"
- "Instructors only manage their organization's content"

---

## 📊 Key Features to Highlight

✅ **Authentication & Authorization**
- JWT-based auth
- Role-based access (Student, Instructor, Org Admin, Platform Admin)
- Secure password hashing

✅ **Multi-Tenancy**
- Organization-based data isolation
- Automatic filtering by organization_id
- No data leakage between organizations

✅ **Course Management**
- Create courses with modules and lessons
- Video upload to Cloudinary
- Progress tracking
- Enrollment system

✅ **Live Classes**
- Jitsi integration (no external accounts needed)
- Auto-generated meeting rooms
- Email notifications to all students
- Calendar integration

✅ **Real-Time Features**
- Dashboard analytics
- Notification system
- Progress tracking
- Completion statistics

✅ **Production Ready**
- Frontend: Vercel (Next.js 15)
- Backend: Local (can deploy to Render/Railway)
- Database: MongoDB Atlas
- CDN: Cloudinary
- Email: Nodemailer

---

## 🆘 Troubleshooting During Demo

### Issue: CORS Error
**Fix:** Add ngrok URL to backend CORS, restart backend

### Issue: 401 Unauthorized
**Fix:** Clear cookies, login again

### Issue: Can't see data
**Fix:** Check backend logs, verify MongoDB connection

### Issue: Video upload fails
**Fix:** Check Cloudinary credentials in server/.env

### Issue: Email not sending
**Fix:** Check email config in server/.env (SMTP settings)

---

## 💡 Backup Plan

If live demo fails:
1. Switch to localhost:3000 (local frontend)
2. Show screenshots/video recording
3. Walk through code architecture
4. Explain deployment strategy

---

## 🎯 Success Metrics

After demo, you should have shown:
- ✅ Working authentication
- ✅ Real data from database
- ✅ Course creation and management
- ✅ Video upload functionality
- ✅ Live class scheduling with emails
- ✅ Student enrollment flow
- ✅ Multi-tenant data isolation
- ✅ Production deployment (Vercel)

---

## 📝 Notes for Senior

**Tech Stack:**
- Frontend: Next.js 15, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT, bcrypt
- Storage: Cloudinary (videos/images)
- Email: Nodemailer
- Live Classes: Jitsi Meet
- Deployment: Vercel (frontend), Local/Render (backend)

**Architecture Highlights:**
- RESTful API design
- Multi-tenant architecture
- Role-based access control
- Secure authentication flow
- Organization-scoped data queries
- Email notification system
- Real-time dashboard updates

**Security Features:**
- CSRF protection
- CORS configuration
- Password hashing (bcrypt)
- JWT token validation
- Input sanitization
- Organization-based authorization

Good luck with your demo! 🚀
