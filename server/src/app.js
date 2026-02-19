const express = require('express');
const cors = require('cors');
const app = express();

// CORS - allow Vercel frontend
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://smart-lms-clean.vercel.app',
      'https://smart-lms-clean-1.onrender.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ [CORS] Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`   Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Server running', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API running', 
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    env: process.env.NODE_ENV
  });
});

// Load routes safely
try {
  const responseMiddleware = require('./middleware/response');
  app.use(responseMiddleware);
  
  const authRoutes = require('./routes/auth');
  app.use('/auth', authRoutes);
  
  const healthRoutes = require('./routes/health');
  app.use('/', healthRoutes);
  
  const publicRoutes = require('./routes/public');
  app.use('/api', publicRoutes);
  
  const organizationRoutes = require('./routes/organizations');
  app.use('/api/organizations', organizationRoutes);
  
  const apiRoutes = require('./api/routes/index');
  app.use('/api', apiRoutes);
  
  const platformRoutes = require('./api/routes/platform.routes');
  app.use('/platform', platformRoutes);
  
  const platformOrganizationsRoutes = require('./routes/platformOrganizations');
  app.use('/platform/organizations', platformOrganizationsRoutes);
  
  const platformAnalyticsRoutes = require('./routes/platformAnalytics');
  app.use('/platform/analytics', platformAnalyticsRoutes);
  
  const platformAdminsRoutes = require('./routes/platformAdmins');
  app.use('/platform/admins', platformAdminsRoutes);
  
  const paymentRoutes = require('./api/routes/payment.routes');
  app.use('/payments', paymentRoutes);
  
  const uploadRoutes = require('./routes/upload');
  app.use('/api/upload', uploadRoutes);
  
  const courseRoutes = require('./routes/courses');
  app.use('/api/courses', courseRoutes);
  
  const sectionRoutes = require('./routes/sections');
  app.use('/api/sections', sectionRoutes);
  
  const lessonRoutes = require('./routes/lessons');
  app.use('/api/lessons', lessonRoutes);
  
  const enrollmentRoutes = require('./routes/enrollments');
  app.use('/api/enrollments', enrollmentRoutes);
  
  const userRoutes = require('./routes/users');
  app.use('/api/users', userRoutes);
  
  const parentRoutes = require('./routes/parents');
  app.use('/api/parents', parentRoutes);
  
  const quizRoutes = require('./routes/quizzes');
  app.use('/api/quizzes', quizRoutes);
  
  const gamificationRoutes = require('./routes/gamification');
  app.use('/api/gamification', gamificationRoutes);
  
  const certificateRoutes = require('./routes/certificates');
  app.use('/api/certificates', certificateRoutes);
  
  const translationRoutes = require('./routes/translation');
  app.use('/api/translate', translationRoutes);
  
  const analyticsRoutes = require('./routes/analytics');
  app.use('/api/analytics', analyticsRoutes);
  
  const notificationRoutes = require('./routes/notifications');
  app.use('/api/notifications', notificationRoutes);
  
  const feesRoutes = require('./routes/fees');
  app.use('/api/fees', feesRoutes);
  
  const attendanceRoutes = require('./routes/attendance');
  app.use('/api/attendance', attendanceRoutes);
  
  const gradesRoutes = require('./routes/grades');
  app.use('/api/grades', gradesRoutes);
  
  const timetableRoutes = require('./routes/timetable');
  app.use('/api/timetable', timetableRoutes);
  
  const eventsRoutes = require('./routes/events');
  app.use('/api/events', eventsRoutes);
  
  const errorRoutes = require('./routes/errors');
  app.use('/api/errors', errorRoutes);
  
  const instructorRoutes = require('./routes/instructor');
  app.use('/instructor', instructorRoutes);
  
  const adminRoutes = require('./routes/admin');
  app.use('/api/admin', adminRoutes);
  
  const forumRoutes = require('./routes/forums');
  app.use('/api/forums', forumRoutes);
  
  const messageRoutes = require('./routes/messages');
  app.use('/api/messages', messageRoutes);
  
  const questionBankRoutes = require('./routes/questionBank');
  app.use('/api/question-banks', questionBankRoutes);
  
  const adminGradesRoutes = require('./routes/adminGrades');
  app.use('/api/admin/grades', adminGradesRoutes);
  
  const adminTimetableRoutes = require('./routes/adminTimetable');
  app.use('/api/admin/timetable', adminTimetableRoutes);
  
  const adminFeesRoutes = require('./routes/adminFees');
  app.use('/api/admin/fees', adminFeesRoutes);
  
  const videoUploadRoutes = require('./routes/videoUpload');
  app.use('/api/instructor', videoUploadRoutes);
  
  const studentLectureRoutes = require('./routes/studentLectures');
  app.use('/student', studentLectureRoutes);
  
  const studentRoutes = require('./routes/student');
  app.use('/student', studentRoutes);
  
  const liveClassesSimpleRoutes = require('./routes/liveClassesSimple');
  app.use(liveClassesSimpleRoutes);
  
  console.log('All routes loaded');
} catch (error) {
  console.error('Route loading error:', error.message);
}

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message });
});

module.exports = app;
