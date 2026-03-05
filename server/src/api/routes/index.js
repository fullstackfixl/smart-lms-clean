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
const collegeAcademicController = require('../../controllers/CollegeAcademicController');
const departmentController = require('../../controllers/DepartmentController');
const semesterController = require('../../controllers/SemesterController');
const subjectController = require('../../controllers/SubjectController');

const router = express.Router();

// Course Management APIs
router.post('/courses', authMiddleware, requireRole(['instructor', 'org_admin']), enforceOrgIsolation, (req, res, next) => courseController.createCourse(req, res, next));
router.get('/courses', (req, res, next) => courseController.getCourses(req, res, next));
// Spec: Get Courses For Student (avoid collision with /courses/:id)
router.get('/courses/student', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { Course, Section, Lesson } = require('../../models');
    const courses = await Course.find({
      organization_id: req.user.organization_id,
      status: 'published',
      isActive: true
    })
      .populate('instructor_id', 'name')
      .select('_id title description instructor_id');

    const results = [];
    for (const course of courses) {
      const sections = await Section.find({ course_id: course._id, isActive: true }).select('_id');
      let totalLessons = 0;
      for (const section of sections) {
        totalLessons += await Lesson.countDocuments({ section_id: section._id, isActive: true });
      }
      results.push({
        _id: course._id,
        title: course.title,
        description: course.description,
        instructor: { name: course.instructor_id?.name || '' },
        totalLessons
      });
    }

    res.success({ courses: results }, 'Courses for student retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to get courses for student', 500);
  }
});
// Spec: Get My Enrolled Courses (alias under /api)
router.get('/courses/my-courses', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { Enrollment } = require('../../models');
    const enrollments = await Enrollment.find({
      student_id: req.user._id,
      organization_id: req.user.organization_id
    })
      .populate({ path: 'course_id', select: 'title description instructor_id', populate: { path: 'instructor_id', select: 'name' } })
      .sort({ enrolledAt: -1 });

    const courses = enrollments.map(e => ({
      _id: e.course_id?._id,
      title: e.course_id?.title,
      description: e.course_id?.description,
      instructor: { name: e.course_id?.instructor_id?.name || '' },
      progress: e.progress?.completionPercentage || 0
    }));

    res.success({ courses }, 'My courses retrieved successfully');
  } catch (error) {
    res.error(error.message, 'Failed to get my courses', 500);
  }
});
router.get('/courses/:id', (req, res, next) => courseController.getCourseById(req, res, next));
router.put('/courses/:id', authMiddleware, enforceOrgIsolation, (req, res, next) => courseController.updateCourse(req, res, next));
router.delete('/courses/:id', authMiddleware, enforceOrgIsolation, (req, res, next) => courseController.deleteCourse(req, res, next));
router.post('/courses/:id/publish', authMiddleware, enforceOrgIsolation, (req, res, next) => courseController.publishCourse(req, res, next));
router.get('/courses/:id/students', authMiddleware, enforceOrgIsolation, (req, res, next) => enrollmentController.getCourseStudents(req, res, next));

// Enrollment APIs
router.post('/enrollments', authMiddleware, enforceOrgIsolation, (req, res, next) => enrollmentController.enrollInCourse(req, res, next));
router.get('/enrollments', authMiddleware, enforceOrgIsolation, (req, res, next) => enrollmentController.getStudentEnrollments(req, res, next));
router.get('/my-courses', authMiddleware, enforceOrgIsolation, (req, res, next) => enrollmentController.getStudentEnrollments(req, res, next));
router.delete('/enrollments/:id', authMiddleware, enforceOrgIsolation, (req, res, next) => enrollmentController.unenroll(req, res, next));

// Assessment APIs
router.post('/quizzes', authMiddleware, enforceOrgIsolation, (req, res, next) => assessmentController.createQuiz(req, res, next));
router.get('/quizzes/:id', authMiddleware, enforceOrgIsolation, (req, res, next) => assessmentController.getQuizById(req, res, next));
router.put('/quizzes/:id', authMiddleware, enforceOrgIsolation, (req, res, next) => assessmentController.updateQuiz(req, res, next));
router.delete('/quizzes/:id', authMiddleware, enforceOrgIsolation, (req, res, next) => assessmentController.deleteQuiz(req, res, next));
router.post('/quizzes/:id/submit', authMiddleware, enforceOrgIsolation, (req, res, next) => assessmentController.submitQuiz(req, res, next));
router.get('/quizzes/:id/attempts', authMiddleware, enforceOrgIsolation, (req, res, next) => assessmentController.getQuizAttempts(req, res, next));
router.get('/attempts/:id', authMiddleware, enforceOrgIsolation, (req, res, next) => assessmentController.getAttemptById(req, res, next));

// Progress & Certificate APIs
router.post('/progress', authMiddleware, enforceOrgIsolation, (req, res, next) => progressController.updateProgress(req, res, next));
router.get('/progress/:course_id', authMiddleware, enforceOrgIsolation, (req, res, next) => progressController.getCourseProgress(req, res, next));
router.get('/certificates', authMiddleware, enforceOrgIsolation, (req, res, next) => progressController.getCertificates(req, res, next));
router.get('/certificates/:id', authMiddleware, enforceOrgIsolation, (req, res, next) => progressController.getCertificateById(req, res, next));
router.post('/certificates/:id/download', authMiddleware, enforceOrgIsolation, (req, res, next) => progressController.downloadCertificate(req, res, next));
router.get('/certificates/verify/:unique_id', (req, res, next) => progressController.verifyCertificate(req, res, next));

// Attendance APIs
router.post('/attendance/mark', authMiddleware, enforceOrgIsolation, (req, res, next) => attendanceController.markAttendance(req, res, next));
router.post('/attendance/bulk', authMiddleware, enforceOrgIsolation, (req, res, next) => attendanceController.bulkMarkAttendance(req, res, next));
router.get('/attendance/report/:user_id', authMiddleware, enforceOrgIsolation, (req, res, next) => attendanceController.getAttendanceReport(req, res, next));
router.get('/attendance/class/:class_id', authMiddleware, enforceOrgIsolation, (req, res, next) => attendanceController.getClassAttendance(req, res, next));
router.get('/attendance/summary/:user_id', authMiddleware, enforceOrgIsolation, (req, res, next) => attendanceController.getAttendanceSummary(req, res, next));

// Gradebook APIs
router.post('/grades/update', authMiddleware, enforceOrgIsolation, (req, res, next) => gradeController.updateGrade(req, res, next));
router.get('/grades/:user_id', authMiddleware, enforceOrgIsolation, (req, res, next) => gradeController.getStudentGrades(req, res, next));
router.get('/grades/course/:course_id', authMiddleware, enforceOrgIsolation, (req, res, next) => gradeController.getCourseGrades(req, res, next));
router.post('/grades/export', authMiddleware, enforceOrgIsolation, (req, res, next) => gradeController.exportGrades(req, res, next));
router.get('/grades/analytics/:course_id', authMiddleware, enforceOrgIsolation, (req, res, next) => gradeController.getGradeAnalytics(req, res, next));

// Timetable APIs
router.post('/timetable/create', authMiddleware, enforceOrgIsolation, (req, res, next) => timetableController.createEntry(req, res, next));
router.get('/timetable/:org_id', authMiddleware, (req, res, next) => timetableController.getOrgTimetable(req, res, next));
router.get('/timetable/user/:user_id', authMiddleware, enforceOrgIsolation, (req, res, next) => timetableController.getUserTimetable(req, res, next));
router.put('/timetable/:id', authMiddleware, enforceOrgIsolation, (req, res, next) => timetableController.updateEntry(req, res, next));
router.delete('/timetable/:id', authMiddleware, enforceOrgIsolation, (req, res, next) => timetableController.deleteEntry(req, res, next));
router.get('/timetable/conflicts', authMiddleware, enforceOrgIsolation, (req, res, next) => timetableController.checkConflicts(req, res, next));

// Fees Management APIs
router.post('/fees/set', authMiddleware, enforceOrgIsolation, (req, res, next) => feeController.setFees(req, res, next));
router.get('/fees/:student_id', authMiddleware, enforceOrgIsolation, (req, res, next) => feeController.getFeeDetails(req, res, next));
router.post('/fees/pay', authMiddleware, enforceOrgIsolation, (req, res, next) => feeController.recordPayment(req, res, next));
router.get('/fees/pending', authMiddleware, enforceOrgIsolation, (req, res, next) => feeController.getPendingFees(req, res, next));
router.get('/fees/history/:student_id', authMiddleware, enforceOrgIsolation, (req, res, next) => feeController.getPaymentHistory(req, res, next));
router.post('/fees/reminder', authMiddleware, enforceOrgIsolation, (req, res, next) => feeController.sendReminder(req, res, next));

// Parent Portal APIs
router.get('/parent/children', authMiddleware, enforceOrgIsolation, (req, res, next) => parentController.getLinkedChildren(req, res, next));
router.post('/parent/link-child', authMiddleware, enforceOrgIsolation, (req, res, next) => parentController.linkChild(req, res, next));
router.get('/parent/progress/:student_id', authMiddleware, enforceOrgIsolation, (req, res, next) => parentController.getChildProgress(req, res, next));
router.get('/parent/attendance/:student_id', authMiddleware, enforceOrgIsolation, (req, res, next) => parentController.getChildAttendance(req, res, next));
router.get('/parent/grades/:student_id', authMiddleware, enforceOrgIsolation, (req, res, next) => parentController.getChildGrades(req, res, next));
router.get('/parent/fees/:student_id', authMiddleware, enforceOrgIsolation, (req, res, next) => parentController.getChildFees(req, res, next));

// College Academic Layer APIs
router.get('/academic/gradebook/:courseId', authMiddleware, requireRole(['instructor', 'org_admin']), enforceOrgIsolation, (req, res, next) => collegeAcademicController.getGradebook(req, res, next));
router.post('/academic/marks', authMiddleware, requireRole(['instructor', 'org_admin']), enforceOrgIsolation, (req, res, next) => collegeAcademicController.updateMarks(req, res, next));
router.get('/academic/transcript/:studentId?', authMiddleware, enforceOrgIsolation, (req, res, next) => collegeAcademicController.getTranscript(req, res, next));

// Academic Structural Management (Admin/Instructor)
router.post('/academic/departments', authMiddleware, requireRole(['org_admin']), enforceOrgIsolation, (req, res, next) => departmentController.create(req, res, next));
router.get('/academic/departments', authMiddleware, enforceOrgIsolation, (req, res, next) => departmentController.getAll(req, res, next));
router.post('/academic/semesters', authMiddleware, requireRole(['org_admin']), enforceOrgIsolation, (req, res, next) => semesterController.create(req, res, next));
router.get('/academic/semesters', authMiddleware, enforceOrgIsolation, (req, res, next) => semesterController.getAll(req, res, next));
router.post('/academic/subjects', authMiddleware, requireRole(['org_admin']), enforceOrgIsolation, (req, res, next) => subjectController.create(req, res, next));
router.get('/academic/subjects', authMiddleware, enforceOrgIsolation, (req, res, next) => subjectController.getAll(req, res, next));

// AI & Gamification APIs
const aiRateLimit = require('express-rate-limit')({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10000, // Removed artificial limit for students
  message: { success: false, message: 'Too many requests to AI tutor, please try again in a minute.' }
});

router.post('/ai/lesson-chat', authMiddleware, requireRole(['student']), enforceOrgIsolation, (req, res, next) => aiController.askLessonQuestion(req, res, next));
router.get('/ai/lesson-chat/:lessonId', authMiddleware, requireRole(['student']), enforceOrgIsolation, (req, res, next) => aiController.getLessonChatHistory(req, res, next));

router.post('/ai/generate-quiz', authMiddleware, (req, res, next) => aiController.generateQuiz(req, res, next));
router.post('/ai/explain-topic', authMiddleware, (req, res, next) => aiController.explainTopic(req, res, next));
router.get('/analytics/predict/:user_id', authMiddleware, enforceOrgIsolation, (req, res, next) => aiController.predictPerformance(req, res, next));
router.post('/gamification/update-points', authMiddleware, enforceOrgIsolation, (req, res, next) => aiController.updatePoints(req, res, next));
router.get('/gamification/leaderboard/:course_id', authMiddleware, enforceOrgIsolation, (req, res, next) => aiController.getLeaderboard(req, res, next));
router.get('/gamification/badges/:user_id', authMiddleware, enforceOrgIsolation, (req, res, next) => aiController.getUserBadges(req, res, next));


module.exports = router;
