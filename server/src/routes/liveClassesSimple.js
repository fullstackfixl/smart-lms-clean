const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const liveClassController = require('../controllers/liveClassController');

// Instructor routes
router.post(
  '/instructor/live-classes',
  authMiddleware,
  requireRole(['instructor']),
  liveClassController.scheduleClass
);

router.get(
  '/instructor/live-classes',
  authMiddleware,
  requireRole(['instructor']),
  liveClassController.getInstructorClasses
);

router.patch(
  '/instructor/live-classes/:id',
  authMiddleware,
  requireRole(['instructor']),
  liveClassController.updateClass
);

router.delete(
  '/instructor/live-classes/:id',
  authMiddleware,
  requireRole(['instructor']),
  liveClassController.cancelClass
);

// Student routes
router.get(
  '/student/live-classes/upcoming',
  authMiddleware,
  requireRole(['student']),
  liveClassController.getUpcomingClasses
);

router.post(
  '/student/live-classes/:id/join',
  authMiddleware,
  requireRole(['student']),
  liveClassController.joinClass
);

// Notification routes (all authenticated users)
router.get(
  '/notifications',
  authMiddleware,
  liveClassController.getNotifications
);

router.patch(
  '/notifications/:id/read',
  authMiddleware,
  liveClassController.markAsRead
);

router.patch(
  '/notifications/read-all',
  authMiddleware,
  liveClassController.markAllAsRead
);

module.exports = router;
