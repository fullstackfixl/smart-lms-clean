const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

console.log('Loading app.js...');

const responseMiddleware = require('./middleware/response');
const ErrorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/logging');

console.log('Loading security middleware...');
// Security middleware
const {
  helmetConfig,
  mongoSanitizeConfig,
  xssConfig,
  sanitizeInput,
  fileUploadSecurity,
  additionalSecurityHeaders
} = require('./middleware/security');

console.log('Loading routes...');
const authRoutes = require('./routes/auth');
const mfaRoutes = require('./routes/mfa');
const apiRoutes = require('./api/routes/index');
const platformRoutes = require('./api/routes/platform.routes');
const platformOrganizationsRoutes = require('./routes/platformOrganizations');
const platformAnalyticsRoutes = require('./routes/platformAnalytics');
const platformAdminsRoutes = require('./routes/platformAdmins');
const paymentRoutes = require('./api/routes/payment.routes');
const healthRoutes = require('./routes/health');

// Additional routes
const organizationRoutes = require('./routes/organizations');
const publicRoutes = require('./routes/public');
const uploadRoutes = require('./routes/upload');
const courseRoutes = require('./routes/courses');
const sectionRoutes = require('./routes/sections');
const lessonRoutes = require('./routes/lessons');
const enrollmentRoutes = require('./routes/enrollments');
const userRoutes = require('./routes/users');
const parentRoutes = require('./routes/parents');
const quizRoutes = require('./routes/quizzes');
const gamificationRoutes = require('./routes/gamification');
const certificateRoutes = require('./routes/certificates');
const translationRoutes = require('./routes/translation');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const feesRoutes = require('./routes/fees');
const attendanceRoutes = require('./routes/attendance');
const gradesRoutes = require('./routes/grades');
const timetableRoutes = require('./routes/timetable');
const eventsRoutes = require('./routes/events');
const errorRoutes = require('./routes/errors');
const instructorRoutes = require('./routes/instructor');
const adminRoutes = require('./routes/admin');
const forumRoutes = require('./routes/forums');
const messageRoutes = require('./routes/messages');
const questionBankRoutes = require('./routes/questionBank');
const adminGradesRoutes = require('./routes/adminGrades');
const adminTimetableRoutes = require('./routes/adminTimetable');
const adminFeesRoutes = require('./routes/adminFees');

console.log('All routes loaded successfully');

const app = express();
console.log('Express app created');

// Trust proxy - REQUIRED for Render, Heroku, and other cloud platforms
// This allows express-rate-limit to work correctly behind a proxy
app.set('trust proxy', 1);

// 0. Security Headers - Helmet.js (MUST BE FIRST)
app.use(helmetConfig);
app.use(additionalSecurityHeaders);

// 1. CORS Middleware - Enable cross-origin requests
const allowedOrigins = [
  'http://localhost:3000', // Local development
  process.env.CLIENT_URL || 'http://localhost:3000',
  'https://smart-lms-clean.vercel.app', // Production frontend
  'https://smart-lms-clean-1.onrender.com', // Backend URL
  '' // Vercel preview deployments
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches Vercel preview pattern
    if (allowedOrigins.includes(origin) || origin.match(/^https:\/\/smart-lms-clean-.*\.vercel\.app$/)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Body Parser - Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());

// 3. Security Middleware - XSS, NoSQL Injection, Input Sanitization
app.use(xssConfig);
app.use(mongoSanitizeConfig);
app.use(sanitizeInput);

// 4. Logging Middleware - Log all requests
app.use(requestLogger);

// 5. Response Middleware - Standardize response format
app.use(responseMiddleware);

// 6. Request Timeout Middleware
app.use(ErrorHandler.timeoutHandler(300000)); // 5 minutes timeout for large uploads

// 7. File Upload Security
app.use(fileUploadSecurity);

// 8. Static Files
app.use('/uploads', express.static('uploads'));

// Health check routes (no auth required)
app.use('/', healthRoutes);

// 9. Routes with Middleware Pipeline
// Authentication routes (public)
app.use('/auth', authRoutes);

// MFA routes (requires authentication)
app.use('/api/mfa', mfaRoutes);

// Organization routes
app.use('/api/organizations', organizationRoutes);

// Public routes (no auth required)
app.use('/api', publicRoutes);

// Upload routes
app.use('/api/upload', uploadRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Course management routes
app.use('/api/courses', courseRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);

// User management routes
app.use('/api/users', userRoutes);
app.use('/api/parents', parentRoutes);

// Learning features
app.use('/api/quizzes', quizRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/certificates', certificateRoutes);

// Utility routes
app.use('/api/translate', translationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// Academic management
app.use('/api/fees', feesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/events', eventsRoutes);

// Communication
app.use('/api/forums', forumRoutes);
app.use('/api/messages', messageRoutes);

// Question bank
app.use('/api/question-banks', questionBankRoutes);

// Admin module routes
app.use('/api/admin/grades', adminGradesRoutes);
app.use('/api/admin/timetable', adminTimetableRoutes);
app.use('/api/admin/fees', adminFeesRoutes);

// Error reporting
app.use('/api/errors', errorRoutes);

// Instructor routes (JWT + role-based, organization-scoped)
app.use('/instructor', instructorRoutes);

// Video upload routes (JWT + role-based) - mounted on /api/instructor to avoid conflict
const videoUploadRoutes = require('./routes/videoUpload');
app.use('/api/instructor', videoUploadRoutes);

// Student lecture routes (JWT + role-based, organization-scoped)
const studentLectureRoutes = require('./routes/studentLectures');
app.use('/student', studentLectureRoutes);

// Student enrollment routes (JWT + role-based, organization-scoped)
const studentRoutes = require('./routes/student');
app.use('/student', studentRoutes);

// Live classes and notifications routes (JWT + role-based)
// Note: These routes are already protected by authMiddleware in the router
const liveClassesSimpleRoutes = require('./routes/liveClassesSimple');
app.use(liveClassesSimpleRoutes);

// API routes (organization-scoped, requires auth)
app.use('/api', apiRoutes);

// Platform organization management routes (MUST BE BEFORE /platform routes)
app.use('/platform/organizations', platformOrganizationsRoutes);

// Platform analytics routes
app.use('/platform/analytics', platformAnalyticsRoutes);

// Platform admins routes
app.use('/platform/admins', platformAdminsRoutes);

// Platform admin routes (requires platform_admin role)
app.use('/platform', platformRoutes);

// Payment routes (requires auth)
app.use('/payments', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart LMS API is running',
    data: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      security: {
        helmet: 'enabled',
        cors: 'enabled',
        rateLimit: 'disabled',
        csrf: 'disabled',
        xss: 'enabled',
        mongoSanitize: 'enabled'
      }
    }
  });
});

app.use('*', ErrorHandler.handle404);
app.use(ErrorHandler.handle);

console.log('App configuration complete, exporting...');

module.exports = app;