const express = require('express');
const courseController = require('../../controllers/platform/courseController');
const { requirePlatformAdmin, requirePlatformStaff } = require('../../middleware/auth');
const router = express.Router();

router.use(requirePlatformStaff);

router.get('/', courseController.getCourses);
router.get('/stats', courseController.getStats);
router.patch('/:courseId/suspend', requirePlatformAdmin, courseController.suspendCourse);

module.exports = router;
