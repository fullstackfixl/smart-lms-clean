const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth').authMiddleware;
const { requireRole } = require('../middleware/auth');
const VideoUploadController = require('../controllers/VideoUploadController');

// All routes require authentication and instructor role
router.use(authMiddleware);
router.use(requireRole(['instructor', 'org_admin']));

// Upload video to lecture
router.post(
  '/lectures/:lectureId/upload-video',
  VideoUploadController.getUploadMiddleware(),
  VideoUploadController.uploadVideo
);

// Delete video from lecture
router.delete('/lectures/:lectureId/video', VideoUploadController.deleteVideo);

// Get video upload status
router.get('/lectures/:lectureId/video-status', VideoUploadController.getVideoStatus);

module.exports = router;
