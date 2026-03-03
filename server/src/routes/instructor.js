const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { requireOrganization } = require('../middleware/orgProtection');
const { enforceOrgIsolation } = require('../middleware/orgIsolation');
const InstructorController = require('../controllers/InstructorController');

const router = express.Router();

const requireInstructor = [
  authMiddleware,
  requireRole(['instructor']),
  requireOrganization,
  enforceOrgIsolation
];

// Dashboard Overview
router.get('/dashboard/overview', ...requireInstructor, (req, res, next) => InstructorController.getDashboardOverview(req, res, next));

// Courses
router.post('/courses', ...requireInstructor, (req, res, next) => InstructorController.createCourse(req, res, next));
router.get('/courses', ...requireInstructor, (req, res, next) => InstructorController.getCourses(req, res, next));
router.get('/courses/:id', ...requireInstructor, (req, res, next) => InstructorController.getCourseById(req, res, next));
router.put('/courses/:id', ...requireInstructor, (req, res, next) => InstructorController.updateCourse(req, res, next));
router.delete('/courses/:id', ...requireInstructor, (req, res, next) => InstructorController.deleteCourse(req, res, next));
router.patch('/courses/:id/publish', ...requireInstructor, (req, res, next) => InstructorController.publishCourse(req, res, next));

// Modules (Sections)
router.post('/courses/:courseId/modules', ...requireInstructor, (req, res, next) => InstructorController.createModule(req, res, next));
router.get('/courses/:courseId/sections', ...requireInstructor, (req, res, next) => InstructorController.getCourseSections(req, res, next));
router.put('/modules/:id', ...requireInstructor, (req, res, next) => InstructorController.updateModule(req, res, next));
router.delete('/modules/:id', ...requireInstructor, (req, res, next) => InstructorController.deleteModule(req, res, next));

// Lessons
router.post('/modules/:moduleId/lessons', ...requireInstructor, (req, res, next) => InstructorController.createLesson(req, res, next));
router.get('/sections/:sectionId/lessons', ...requireInstructor, (req, res, next) => InstructorController.getSectionLessons(req, res, next));
router.put('/lessons/:id', ...requireInstructor, (req, res, next) => InstructorController.updateLesson(req, res, next));
router.delete('/lessons/:id', ...requireInstructor, (req, res, next) => InstructorController.deleteLesson(req, res, next));

// Quizzes
router.post('/courses/:courseId/quizzes/generate', ...requireInstructor, (req, res, next) => InstructorController.generateAIQuiz(req, res, next));
router.post('/courses/:courseId/quizzes', ...requireInstructor, (req, res, next) => InstructorController.createQuiz(req, res, next));
router.put('/quizzes/:id', ...requireInstructor, (req, res, next) => InstructorController.updateQuiz(req, res, next));
router.delete('/quizzes/:id', ...requireInstructor, (req, res, next) => InstructorController.deleteQuiz(req, res, next));

// Students & Analytics
router.get('/courses/:id/students', ...requireInstructor, (req, res, next) => InstructorController.getCourseStudents(req, res, next));
router.get('/courses/:id/analytics', ...requireInstructor, (req, res, next) => InstructorController.getCourseAnalytics(req, res, next));

// Announcements
router.post('/courses/:id/announcements', ...requireInstructor, (req, res, next) => InstructorController.createAnnouncement(req, res, next));
router.get('/courses/:id/announcements', ...requireInstructor, (req, res, next) => InstructorController.getAnnouncements(req, res, next));
router.delete('/announcements/:id', ...requireInstructor, (req, res, next) => InstructorController.deleteAnnouncement(req, res, next));

// Submissions Review
router.get('/submissions', ...requireInstructor, (req, res, next) => InstructorController.getSubmissions(req, res, next));
router.get('/quiz-submissions', ...requireInstructor, (req, res, next) => InstructorController.getQuizSubmissions(req, res, next));
router.get('/quiz-submissions/:id', ...requireInstructor, (req, res, next) => InstructorController.getQuizSubmissionById(req, res, next));
router.patch('/submissions/:id/grade', ...requireInstructor, (req, res, next) => InstructorController.gradeSubmission(req, res, next));

// Notifications
router.get('/notifications', ...requireInstructor, (req, res, next) => InstructorController.getNotifications(req, res, next));
router.patch('/notifications/:id/read', ...requireInstructor, (req, res, next) => InstructorController.markNotificationRead(req, res, next));
router.patch('/notifications/read-all', ...requireInstructor, (req, res, next) => InstructorController.markAllNotificationsRead(req, res, next));
router.delete('/notifications/:id', ...requireInstructor, (req, res, next) => InstructorController.deleteNotification(req, res, next));


module.exports = router;

