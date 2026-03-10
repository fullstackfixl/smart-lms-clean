const express = require('express');
const courseController = require('../../controllers/platformAdmin/courseController');
const router = express.Router();

router.get('/', courseController.list);
router.patch('/:courseId/suspend', courseController.suspend);
router.patch('/:courseId/activate', courseController.activate);

module.exports = router;
