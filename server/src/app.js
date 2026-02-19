const express = require('express');
require('dotenv').config();

const responseMiddleware = require('./middleware/response');
const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');
const publicRoutes = require('./routes/public');
const organizationRoutes = require('./routes/organizations');
const apiRoutes = require('./api/routes/index');
const platformRoutes = require('./api/routes/platform.routes');
const platformOrganizationsRoutes = require('./routes/platformOrganizations');
const platformAnalyticsRoutes = require('./routes/platformAnalytics');
const platformAdminsRoutes = require('./routes/platformAdmins');
const paymentRoutes = require('./api/routes/payment.routes');
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
const videoUploadRoutes = require('./routes/videoUpload');
const studentLectureRoutes = require('./routes/studentLectures');
const studentRoutes = require('./routes/student');
const liveClassesSimpleRoutes = require('./routes/liveClassesSimple');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseMiddleware);

app.use('/', healthRoutes);
app.use('/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api', publicRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/translate', translationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/forums', forumRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/question-banks', questionBankRoutes);
app.use('/api/admin/grades', adminGradesRoutes);
app.use('/api/admin/timetable', adminTimetableRoutes);
app.use('/api/admin/fees', adminFeesRoutes);
app.use('/api/errors', errorRoutes);
app.use('/instructor', instructorRoutes);
app.use('/api/instructor', videoUploadRoutes);
app.use('/student', studentLectureRoutes);
app.use('/student', studentRoutes);
app.use(liveClassesSimpleRoutes);
app.use('/api', apiRoutes);
app.use('/platform/organizations', platformOrganizationsRoutes);
app.use('/platform/analytics', platformAnalyticsRoutes);
app.use('/platform/admins', platformAdminsRoutes);
app.use('/platform', platformRoutes);
app.use('/payments', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API running',
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message });
});

module.exports = app;
