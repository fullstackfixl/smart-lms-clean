const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const responseMiddleware = require('./middleware/response');
const ErrorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/logging');
const logger = require('./utils/logger');

// Security middleware
const {
  helmetConfig,
  mongoSanitizeConfig,
  xssConfig,
  csrfProtection,
  attachCsrfToken,
  csrfTokenEndpoint,
  csrfErrorHandler,
  sanitizeInput,
  fileUploadSecurity,
  additionalSecurityHeaders
} = require('./middleware/security');

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
// const liveClassRoutes = require('./routes/liveClasses'); // OLD - Replaced by liveClassesSimple
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

const app = express();

// Connect to MongoDB (skip in test environment as tests use in-memory DB)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// 0. Security Headers - Helmet.js (MUST BE FIRST)
app.use(helmetConfig);
app.use(additionalSecurityHeaders);

// 1. CORS Middleware - Enable cross-origin requests
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000', // Support both ports
  'https://smart-lms-clean.vercel.app', // Production frontend
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token']
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

// 5. Rate Limiting Middleware - Prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/api/health';
  }
});

app.use(limiter);

// 6. Response Middleware - Standardize response format
app.use(responseMiddleware);

// 7. CSRF Protection - Enable for state-changing operations
// Attach CSRF token to all requests
app.use(attachCsrfToken);

// CSRF token endpoint (public)
app.get('/api/csrf-token', csrfTokenEndpoint);

// 8. Request Timeout Middleware
app.use(ErrorHandler.timeoutHandler(300000)); // 5 minutes timeout for large uploads

// 9. File Upload Security
app.use(fileUploadSecurity);

// 10. Static Files
app.use('/uploads', express.static('uploads'));

// Health check routes (no auth required)
app.use('/', healthRoutes);

// 11. Routes with Middleware Pipeline
// Authentication routes (public) - Apply CSRF to POST routes
app.use('/auth', authRoutes);

// MFA routes (requires authentication)
app.use('/api/mfa', mfaRoutes);

// Organization routes
app.use('/api/organizations', csrfProtection, organizationRoutes);

// Public routes (no auth required)
app.use('/api', publicRoutes);

// Upload routes
app.use('/api/upload', csrfProtection, uploadRoutes);

// Admin routes
app.use('/api/admin', csrfProtection, adminRoutes);

// Course management routes
app.use('/api/courses', csrfProtection, courseRoutes);
app.use('/api/sections', csrfProtection, sectionRoutes);
app.use('/api/lessons', csrfProtection, lessonRoutes);
app.use('/api/enrollments', csrfProtection, enrollmentRoutes);

// User management routes
app.use('/api/users', csrfProtection, userRoutes);
app.use('/api/parents', csrfProtection, parentRoutes);

// Learning features
app.use('/api/quizzes', csrfProtection, quizRoutes);
app.use('/api/gamification', csrfProtection, gamificationRoutes);
app.use('/api/certificates', csrfProtection, certificateRoutes);
// app.use('/api/live-classes', csrfProtection, liveClassRoutes); // OLD - Replaced by liveClassesSimple

// Utility routes
app.use('/api/translate', csrfProtection, translationRoutes);
app.use('/api/analytics', csrfProtection, analyticsRoutes);
app.use('/api/notifications', csrfProtection, notificationRoutes);

// Academic management
app.use('/api/fees', csrfProtection, feesRoutes);
app.use('/api/attendance', csrfProtection, attendanceRoutes);
app.use('/api/grades', csrfProtection, gradesRoutes);
app.use('/api/timetable', csrfProtection, timetableRoutes);
app.use('/api/events', csrfProtection, eventsRoutes);

// Communication
app.use('/api/forums', csrfProtection, forumRoutes);
app.use('/api/messages', csrfProtection, messageRoutes);

// Question bank
app.use('/api/question-banks', csrfProtection, questionBankRoutes);

// Admin module routes
app.use('/api/admin/grades', csrfProtection, adminGradesRoutes);
app.use('/api/admin/timetable', csrfProtection, adminTimetableRoutes);
app.use('/api/admin/fees', csrfProtection, adminFeesRoutes);

// Error reporting
app.use('/api/errors', csrfProtection, errorRoutes);

// Instructor routes (JWT + role-based, organization-scoped)
app.use('/instructor', csrfProtection, instructorRoutes);

// Video upload routes (JWT + role-based) - mounted on /api/instructor to avoid conflict
const videoUploadRoutes = require('./routes/videoUpload');
app.use('/api/instructor', csrfProtection, videoUploadRoutes);

// Student lecture routes (JWT + role-based, organization-scoped)
const studentLectureRoutes = require('./routes/studentLectures');
app.use('/student', csrfProtection, studentLectureRoutes);

// Student enrollment routes (JWT + role-based, organization-scoped)
const studentRoutes = require('./routes/student');
app.use('/student', csrfProtection, studentRoutes);

// Live classes and notifications routes (JWT + role-based)
const liveClassesSimpleRoutes = require('./routes/liveClassesSimple');
app.use('/', csrfProtection, liveClassesSimpleRoutes);

// API routes (organization-scoped, requires auth)
// Middleware applied: Auth → Authorization → Org Isolation → CSRF
app.use('/api', csrfProtection, apiRoutes);

// Platform organization management routes (MUST BE BEFORE /platform routes)
app.use('/platform/organizations', csrfProtection, platformOrganizationsRoutes);

// Platform analytics routes
app.use('/platform/analytics', csrfProtection, platformAnalyticsRoutes);

// Platform admins routes
app.use('/platform/admins', csrfProtection, platformAdminsRoutes);

// Platform admin routes (requires platform_admin role)
app.use('/platform', csrfProtection, platformRoutes);

// Payment routes (requires auth)
app.use('/payments', csrfProtection, paymentRoutes);

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
        rateLimit: 'enabled',
        csrf: 'enabled',
        xss: 'enabled',
        mongoSanitize: 'enabled'
      }
    }
  });
});

app.use('*', ErrorHandler.handle404);
app.use(csrfErrorHandler);
app.use(ErrorHandler.handle);

process.on('uncaughtException', ErrorHandler.handleUncaughtException);
process.on('unhandledRejection', ErrorHandler.handleUnhandledRejection);

module.exports = app;
