const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth').authMiddleware;
const checkStudentLectureAccess = require('../middleware/checkStudentLectureAccess');
const StudentLectureController = require('../controllers/StudentLectureController');

// All routes require authentication
router.use(authMiddleware);

// Get all lectures for a course with progress
router.get('/courses/:courseId/lectures', StudentLectureController.getCourseLectures);

// Get single lecture details
router.get('/lectures/:lectureId', checkStudentLectureAccess, StudentLectureController.getLecture);

// Update lecture progress
router.post('/lectures/:lectureId/progress', checkStudentLectureAccess, StudentLectureController.updateProgress);

// Submit quiz
router.post('/lectures/:lectureId/quiz/submit', checkStudentLectureAccess, StudentLectureController.submitQuiz);

module.exports = router;
