const express = require('express');
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { enforceOrgIsolation } = require('../../middleware/orgIsolation');

// Import Controllers
const courseController = require('../../controllers/courseController');
const enrollmentController = require('../../controllers/enrollmentController');
const assessmentController = require('../../controllers/assessmentController');
const progressController = require('../../controllers/progressController');
const attendanceController = require('../../controllers/attendanceController');
const gradeController = require('../../controllers/gradeController');
const timetableController = require('../../controllers/timetableController');
const liveClassController = require('../../controllers/liveClassController');
const feeController = require('../../controllers/feeController');
const parentController = require('../../controllers/parentController');
const aiController = require('../../controllers/aiController');

const router = express.Router();

// Course Management APIs
router.post('/courses', authMiddleware, requireRole(['teacher', 'admin']), enforceOrgIsolation, courseController.createCourse);
router.get('/courses', courseController.getCourses);
router.get('/courses/:id', courseController.getCourseById);
router.put('/courses/:id', authMiddleware, enforceOrgIsolation, courseController.updateCourse);
router.delete('/courses/:id', authMiddleware, enforceOrgIsolation, courseController.deleteCourse);
router.post('/courses/:id/publish', authMiddleware, enforceOrgIsolation, courseController.publishCourse);
router.get('/courses/:id/students', authMiddleware, enforceOrgIsolation, enrollmentController.getCourseStudents);

// Enrollment APIs
router.post('/enrollments', authMiddleware, enforceOrgIsolation, enrollmentController.enrollInCourse);
router.get('/enrollments', authMiddleware, enforceOrgIsolation, enrollmentController.getStudentEnrollments);
router.get('/my-courses', authMiddleware, enforceOrgIsolation, enrollmentController.getStudentEnrollments);
router.delete('/enrollments/:id', authMiddleware, enforceOrgIsolation, enrollmentController.unenroll);

// Assessment APIs
router.post('/quizzes', authMiddleware, enforceOrgIsolation, assessmentController.createQuiz);
router.get('/quizzes/:id', authMiddleware, enforceOrgIsolation, assessmentController.getQuizById);
router.put('/quizzes/:id', authMiddleware, enforceOrgIsolation, assessmentController.updateQuiz);
router.delete('/quizzes/:id', authMiddleware, enforceOrgIsolation, assessmentController.deleteQuiz);
router.post('/quizzes/:id/submit', authMiddleware, enforceOrgIsolation, assessmentController.submitQuiz);
router.get('/quizzes/:id/attempts', authMiddleware, enforceOrgIsolation, assessmentController.getQuizAttempts);
router.get('/attempts/:id', authMiddleware, enforceOrgIsolation, assessmentController.getAttemptById);

// Progress & Certificate APIs
router.post('/progress', authMiddleware, enforceOrgIsolation, progressController.updateProgress);
router.get('/progress/:course_id', authMiddleware, enforceOrgIsolation, progressController.getCourseProgress);
router.get('/certificates', authMiddleware, enforceOrgIsolation, progressController.getCertificates);
router.get('/certificates/:id', authMiddleware, enforceOrgIsolation, progressController.getCertificateById);
router.post('/certificates/:id/download', authMiddleware, enforceOrgIsolation, progressController.downloadCertificate);
router.get('/certificates/verify/:unique_id', progressController.verifyCertificate);

// Attendance APIs
router.post('/attendance/mark', authMiddleware, enforceOrgIsolation, attendanceController.markAttendance);
router.post('/attendance/bulk', authMiddleware, enforceOrgIsolation, attendanceController.bulkMarkAttendance);
router.get('/attendance/report/:user_id', authMiddleware, enforceOrgIsolation, attendanceController.getAttendanceReport);
router.get('/attendance/class/:class_id', authMiddleware, enforceOrgIsolation, attendanceController.getClassAttendance);
router.get('/attendance/summary/:user_id', authMiddleware, enforceOrgIsolation, attendanceController.getAttendanceSummary);

// Gradebook APIs
router.post('/grades/update', authMiddleware, enforceOrgIsolation, gradeController.updateGrade);
router.get('/grades/:user_id', authMiddleware, enforceOrgIsolation, gradeController.getStudentGrades);
router.get('/grades/course/:course_id', authMiddleware, enforceOrgIsolation, gradeController.getCourseGrades);
router.post('/grades/export', authMiddleware, enforceOrgIsolation, gradeController.exportGrades);
router.get('/grades/analytics/:course_id', authMiddleware, enforceOrgIsolation, gradeController.getGradeAnalytics);

// Timetable APIs
router.post('/timetable/create', authMiddleware, enforceOrgIsolation, timetableController.createEntry);
router.get('/timetable/:org_id', authMiddleware, timetableController.getOrgTimetable);
router.get('/timetable/user/:user_id', authMiddleware, enforceOrgIsolation, timetableController.getUserTimetable);
router.put('/timetable/:id', authMiddleware, enforceOrgIsolation, timetableController.updateEntry);
router.delete('/timetable/:id', authMiddleware, enforceOrgIsolation, timetableController.deleteEntry);
router.get('/timetable/conflicts', authMiddleware, enforceOrgIsolation, timetableController.checkConflicts);

// Live Class APIs - DISABLED (Using new routes in liveClassesSimple.js)
// router.post('/live-classes/schedule', authMiddleware, enforceOrgIsolation, liveClassController.scheduleClass);
// router.get('/live-classes/:id/join', authMiddleware, enforceOrgIsolation, liveClassController.getJoinLink);
// router.put('/live-classes/:id', authMiddleware, enforceOrgIsolation, liveClassController.updateClass);
// router.delete('/live-classes/:id', authMiddleware, enforceOrgIsolation, liveClassController.cancelClass);
// router.get('/live-classes/upcoming', authMiddleware, enforceOrgIsolation, liveClassController.getUpcomingClasses);
// router.post('/live-classes/:id/recording', authMiddleware, enforceOrgIsolation, liveClassController.uploadRecording);

// Fees Management APIs
router.post('/fees/set', authMiddleware, enforceOrgIsolation, feeController.setFees);
router.get('/fees/:student_id', authMiddleware, enforceOrgIsolation, feeController.getFeeDetails);
router.post('/fees/pay', authMiddleware, enforceOrgIsolation, feeController.recordPayment);
router.get('/fees/pending', authMiddleware, enforceOrgIsolation, feeController.getPendingFees);
router.get('/fees/history/:student_id', authMiddleware, enforceOrgIsolation, feeController.getPaymentHistory);
router.post('/fees/reminder', authMiddleware, enforceOrgIsolation, feeController.sendReminder);

// Parent Portal APIs
router.get('/parent/children', authMiddleware, enforceOrgIsolation, parentController.getLinkedChildren);
router.post('/parent/link-child', authMiddleware, enforceOrgIsolation, parentController.linkChild);
router.get('/parent/progress/:student_id', authMiddleware, enforceOrgIsolation, parentController.getChildProgress);
router.get('/parent/attendance/:student_id', authMiddleware, enforceOrgIsolation, parentController.getChildAttendance);
router.get('/parent/grades/:student_id', authMiddleware, enforceOrgIsolation, parentController.getChildGrades);
router.get('/parent/fees/:student_id', authMiddleware, enforceOrgIsolation, parentController.getChildFees);

// AI & Gamification APIs
router.post('/ai/generate-quiz', authMiddleware, aiController.generateQuiz);
router.post('/ai/explain-topic', authMiddleware, aiController.explainTopic);
router.get('/analytics/predict/:user_id', authMiddleware, enforceOrgIsolation, aiController.predictPerformance);
router.post('/gamification/update-points', authMiddleware, enforceOrgIsolation, aiController.updatePoints);
router.get('/gamification/leaderboard/:course_id', authMiddleware, enforceOrgIsolation, aiController.getLeaderboard);
router.get('/gamification/badges/:user_id', authMiddleware, enforceOrgIsolation, aiController.getUserBadges);

module.exports = router;
