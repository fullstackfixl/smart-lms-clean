const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { enforceOrgIsolation } = require('../middleware/orgIsolation');
const InstructorController = require('../controllers/InstructorController');

const router = express.Router();

const requireInstructor = [
  authMiddleware,
  requireRole(['instructor']),
  enforceOrgIsolation
];

// Dashboard Overview
router.get('/dashboard/overview', ...requireInstructor, InstructorController.getDashboardOverview);

// Courses
router.post('/courses', ...requireInstructor, InstructorController.createCourse);
router.get('/courses', ...requireInstructor, InstructorController.getCourses);
router.get('/courses/:id', ...requireInstructor, InstructorController.getCourseById);
router.put('/courses/:id', ...requireInstructor, InstructorController.updateCourse);
router.delete('/courses/:id', ...requireInstructor, InstructorController.deleteCourse);
router.patch('/courses/:id/publish', ...requireInstructor, InstructorController.publishCourse);

// Modules (Sections)
router.post('/courses/:courseId/modules', ...requireInstructor, InstructorController.createModule);
router.get('/courses/:courseId/sections', ...requireInstructor, InstructorController.getCourseSections);
router.put('/modules/:id', ...requireInstructor, InstructorController.updateModule);
router.delete('/modules/:id', ...requireInstructor, InstructorController.deleteModule);

// Lessons
router.post('/modules/:moduleId/lessons', ...requireInstructor, InstructorController.createLesson);
router.get('/sections/:sectionId/lessons', ...requireInstructor, InstructorController.getSectionLessons);
router.put('/lessons/:id', ...requireInstructor, InstructorController.updateLesson);
router.delete('/lessons/:id', ...requireInstructor, InstructorController.deleteLesson);

// Quizzes
router.post('/courses/:courseId/quizzes', ...requireInstructor, InstructorController.createQuiz);
router.put('/quizzes/:id', ...requireInstructor, InstructorController.updateQuiz);
router.delete('/quizzes/:id', ...requireInstructor, InstructorController.deleteQuiz);

// Students & Analytics
router.get('/courses/:id/students', ...requireInstructor, InstructorController.getCourseStudents);
router.get('/courses/:id/analytics', ...requireInstructor, InstructorController.getCourseAnalytics);

// Announcements
router.post('/courses/:id/announcements', ...requireInstructor, InstructorController.createAnnouncement);
router.get('/courses/:id/announcements', ...requireInstructor, InstructorController.getAnnouncements);
router.delete('/announcements/:id', ...requireInstructor, InstructorController.deleteAnnouncement);

// Submissions Review
router.get('/submissions', ...requireInstructor, InstructorController.getSubmissions);
router.patch('/submissions/:id/grade', ...requireInstructor, InstructorController.gradeSubmission);

// Notifications
router.get('/notifications', ...requireInstructor, InstructorController.getNotifications);
router.patch('/notifications/:id/read', ...requireInstructor, InstructorController.markNotificationRead);
router.patch('/notifications/read-all', ...requireInstructor, InstructorController.markAllNotificationsRead);
router.delete('/notifications/:id', ...requireInstructor, InstructorController.deleteNotification);

module.exports = router;

