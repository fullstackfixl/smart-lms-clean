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
// GET /student/live-classes — all org-scoped classes (enrolled courses only)
router.get(
  '/student/live-classes',
  authMiddleware,
  requireRole(['student']),
  async (req, res) => {
    try {
      const mongoose = require('mongoose');
      const LiveClass = require('../models/LiveClass');
      const Enrollment = require('../models/Enrollment');

      const orgId = req.user.organization_id?._id || req.user.organization_id;
      const now = new Date();

      // SECURITY: org-scoped enrollment lookup — never trust user to pass org
      const enrollments = await Enrollment.find({
        student_id: req.user._id,
        organization_id: orgId,
        status: 'active'
      }).select('course_id').lean();

      const enrolledCourseIds = enrollments.map(e => e.course_id);

      if (enrolledCourseIds.length === 0) {
        return res.json({ success: true, data: { classes: [] } });
      }

      // SECURITY: double org filter on live class itself
      const classes = await LiveClass.find({
        organization_id: orgId,           // ← org isolation
        course_id: { $in: enrolledCourseIds }, // ← enrollment filter
        is_active: true,
        status: { $in: ['scheduled', 'live', 'completed'] }
      })
        .populate('course_id', 'title thumbnail')
        .populate('instructor_id', 'name email')
        .sort({ scheduled_date: 1 })
        .limit(100)
        .lean();

      // Enrich each class with canJoin and isLive flags
      const enriched = classes.map(lc => {
        const classDate = new Date(lc.scheduled_date);
        const [h, m] = (lc.start_time || '00:00').split(':').map(Number);
        classDate.setHours(h, m, 0, 0);
        const endDate = new Date(classDate.getTime() + (lc.duration_minutes || 60) * 60000);

        const isLive = lc.status === 'live' || (now >= classDate && now <= endDate);
        const openWindow = new Date(classDate.getTime() - 10 * 60000); // 10 min before
        const canJoin = now >= openWindow && now <= endDate && lc.status !== 'cancelled';

        return {
          _id: lc._id,
          title: lc.title,
          description: lc.description,
          course_id: lc.course_id,
          instructor_id: lc.instructor_id,
          scheduled_date: lc.scheduled_date,
          start_time: lc.start_time,
          duration_minutes: lc.duration_minutes,
          meeting_url: lc.meeting_url || null,   // always return URL; join opens in new tab
          status: lc.status,
          isLive,
          canJoin,
          max_participants: lc.max_participants,
          current_participants: lc.current_participants || 0,
          recording_enabled: lc.recording_enabled
        };
      });

      res.json({ success: true, data: { classes: enriched } });
    } catch (err) {
      console.error('[student/live-classes] error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

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
