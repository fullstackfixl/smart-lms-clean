const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();

// CORS - allow Vercel frontend and any CLIENT_URL in env
app.use(cors({
  origin: function (origin, callback) {
    // Build allowed list dynamically from env + hardcoded fallbacks
    const allowedOrigins = [
      'https://smart-lms-clean.vercel.app',
      'https://smart-lms-clean-1.onrender.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];

    // Allow any additional origin from CLIENT_URL env (comma-separated)
    if (process.env.CLIENT_URL) {
      process.env.CLIENT_URL.split(',').forEach(u => allowedOrigins.push(u.trim()));
    }

    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
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
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ [JSON PARSE ERROR]:', err.message);
    return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
  }
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Log all requests
app.use((req, res, next) => {
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`   Origin: ${req.headers.origin || 'none'}`);
  if (req.path.startsWith('/api/org')) {
    console.log(`   Headers:`, JSON.stringify(req.headers, null, 2));
  }
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

  console.log('📦 Loading routes...');

  console.log('  - auth');
  const authRoutes = require('./routes/auth');
  app.use('/auth', authRoutes);

  console.log('  - health');
  const healthRoutes = require('./routes/health');
  app.use('/', healthRoutes);

  console.log('  - public');
  const publicRoutes = require('./routes/public');
  app.use('/api', publicRoutes);

  console.log('  - organizations');
  const organizationRoutes = require('./routes/organizations');
  app.use('/api/organizations', organizationRoutes);

  console.log('  - api');
  const apiRoutes = require('./api/routes/index');
  app.use('/api', apiRoutes);

  console.log('  - platform');
  const platformRoutes = require('./routes/platform');
  app.use('/platform', platformRoutes);

  console.log('  - payments');
  const paymentRoutes = require('./api/routes/payment.routes');
  app.use('/payments', paymentRoutes);

  console.log('  - upload');
  const uploadRoutes = require('./routes/upload');
  app.use('/api/upload', uploadRoutes);

  console.log('  - courses');
  const courseRoutes = require('./routes/courses');
  app.use('/api/courses', courseRoutes);

  console.log('  - sections');
  const sectionRoutes = require('./routes/sections');
  app.use('/api/sections', sectionRoutes);

  console.log('  - lessons');
  const lessonRoutes = require('./routes/lessons');
  app.use('/api/lessons', lessonRoutes);

  console.log('  - enrollments');
  const enrollmentRoutes = require('./routes/enrollments');
  app.use('/api/enrollments', enrollmentRoutes);

  console.log('  - users');
  const userRoutes = require('./routes/users');
  app.use('/api/users', userRoutes);

  console.log('  - parent');
  const parentRoutes = require('./routes/parents');
  app.use('/api/parent', parentRoutes);

  console.log('  - quizzes');
  const quizRoutes = require('./routes/quizzes');
  app.use('/api/quizzes', quizRoutes);

  console.log('  - gamification');
  const gamificationRoutes = require('./routes/gamification');
  app.use('/api/gamification', gamificationRoutes);

  console.log('  - certificates');
  const certificateRoutes = require('./routes/certificates');
  app.use('/api/certificates', certificateRoutes);

  console.log('  - translate');
  const translationRoutes = require('./routes/translation');
  app.use('/api/translate', translationRoutes);

  console.log('  - analytics');
  const analyticsRoutes = require('./routes/analytics');
  app.use('/api/analytics', analyticsRoutes);

  console.log('  - notifications');
  const notificationRoutes = require('./routes/notifications');
  app.use('/api/notifications', notificationRoutes);

  console.log('  - fees');
  const feesRoutes = require('./routes/fees');
  app.use('/api/fees', feesRoutes);

  console.log('  - attendance');
  const attendanceRoutes = require('./routes/attendance');
  app.use('/api/attendance', attendanceRoutes);

  console.log('  - grades');
  const gradesRoutes = require('./routes/grades');
  app.use('/api/grades', gradesRoutes);

  console.log('  - timetable');
  const timetableRoutes = require('./routes/timetable');
  app.use('/api/timetable', timetableRoutes);

  console.log('  - events');
  const eventsRoutes = require('./routes/events');
  app.use('/api/events', eventsRoutes);

  console.log('  - errors');
  const errorRoutes = require('./routes/errors');
  app.use('/api/errors', errorRoutes);

  console.log('  - instructor');
  const instructorRoutes = require('./routes/instructor');
  app.use('/instructor', instructorRoutes);

  console.log('  - instructor uploads');
  const instructorUploadRoutes = require('./routes/videoUpload');
  app.use('/api/instructor', instructorUploadRoutes);

  console.log('  - instructor-live-classes');
  const instructorLiveClassRoutes = require('./routes/instructorLiveClasses');
  app.use('/instructor/live-classes', instructorLiveClassRoutes);

  console.log('  - admin');
  const adminRoutes = require('./routes/admin');
  app.use('/api/admin', adminRoutes);

  console.log('  - forums');
  const forumRoutes = require('./routes/forums');
  app.use('/api/forums', forumRoutes);

  console.log('  - messages');
  const messageRoutes = require('./routes/messages');
  app.use('/api/messages', messageRoutes);

  console.log('  - question-banks');
  const questionBankRoutes = require('./routes/questionBank');
  app.use('/api/question-banks', questionBankRoutes);

  console.log('  - admin-grades');
  const adminGradesRoutes = require('./routes/adminGrades');
  app.use('/api/admin/grades', adminGradesRoutes);

  console.log('  - admin-timetable');
  const adminTimetableRoutes = require('./routes/adminTimetable');
  app.use('/api/admin/timetable', adminTimetableRoutes);

  console.log('  - admin-fees');
  const adminFeesRoutes = require('./routes/adminFees');
  app.use('/api/admin/fees', adminFeesRoutes);

  console.log('  - instructor-video');
  const videoUploadRoutes = require('./routes/videoUpload');
  app.use('/api/instructor', videoUploadRoutes);

  console.log('  - org-users');
  const orgUsersRoutes = require('./routes/orgUsers');
  app.use('/api/org', orgUsersRoutes);

  console.log('  - student-lectures');
  const studentLectureRoutes = require('./routes/studentLectures');
  app.use('/student', studentLectureRoutes);

  console.log('  - student-registration');
  const studentRegistrationRoutes = require('./routes/studentRoutes');
  app.use('/api/student', studentRegistrationRoutes);

  console.log('  - student');
  const studentRoutes = require('./routes/student');
  app.use('/student', studentRoutes);

  console.log('  - live-classes-simple');
  const liveClassesSimpleRoutes = require('./routes/liveClassesSimple');
  app.use(liveClassesSimpleRoutes);

  console.log('✨ All routes loaded successfully');
} catch (error) {
  console.error('❌ Route loading error:', error.message);
  console.error(error.stack);
}


app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message });
});

module.exports = app;
