const express = require('express');
const courseController = require('../../controllers/platform/courseController');
const router = express.Router();

router.get('/', courseController.getCourses);
router.patch('/:courseId/suspend', courseController.suspendCourse);

module.exports = router;
