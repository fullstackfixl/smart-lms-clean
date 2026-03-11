const express = require('express');
const router = express.Router();

const studentController = require('../../controllers/college/collegeStudentController');
const { verifyJWT, checkRole, checkOrganization } = require('../../middleware/collegeTenant');

router.use(verifyJWT, checkOrganization, checkRole(['student']));

router.get('/dashboard', studentController.getDashboard);
router.get('/courses/:id', studentController.getCourse);
router.post('/live-class/:id/join', studentController.joinLiveClass);
router.post('/quiz/:id/submit', studentController.submitQuiz);

module.exports = router;
