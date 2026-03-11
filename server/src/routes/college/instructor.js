const express = require('express');
const router = express.Router();

const instructorController = require('../../controllers/college/collegeInstructorController');
const { verifyJWT, checkRole, checkOrganization } = require('../../middleware/collegeTenant');

router.use(verifyJWT, checkOrganization, checkRole(['instructor']));

router.get('/dashboard', instructorController.getDashboard);
router.get('/courses', instructorController.getInstructorCourses);
router.post('/courses/:id/modules', instructorController.createModule);
router.post('/courses/:id/quizzes', instructorController.createQuiz);
router.post('/courses/:id/live-class', instructorController.startLiveClass);
router.get('/courses/:id/students', instructorController.getCourseStudents);
router.post('/courses/:id/attendance', instructorController.markAttendance);

module.exports = router;
