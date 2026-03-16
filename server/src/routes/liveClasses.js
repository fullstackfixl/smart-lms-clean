const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');
const LiveClass = require('../models/LiveClass');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const emailService = require('../utils/emailService');
const router = express.Router();

// Validation middleware
const validateLiveClassCreation = [
  body('course_id')
    .isMongoId()
    .withMessage('Valid course ID is required'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('scheduled_date')
    .isISO8601()
    .withMessage('Valid scheduled date is required'),
  body('start_time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('duration_minutes')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('recording_enabled')
    .optional()
    .isBoolean()
    .withMessage('Recording enabled must be a boolean'),
  body('max_participants')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Max participants must be between 1 and 200'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a valid string')
];

const validateLiveClassUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Valid live class ID is required'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('scheduled_date')
    .optional()
    .isISO8601()
    .withMessage('Valid scheduled date is required'),
  body('start_time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('duration_minutes')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('recording_enabled')
    .optional()
    .isBoolean()
    .withMessage('Recording enabled must be a boolean'),
  body('max_participants')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Max participants must be between 1 and 200')
];

// Middleware to check instructor permissions
const checkInstructorPermission = async (req, res, next) => {
  try {
    if (!['instructor', 'teacher', 'admin', 'org_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only instructors and admins can manage live classes'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Permission check failed'
    });
  }
};

// POST /api/live-classes - Create new live class
router.post('/', auth, checkInstructorPermission, validateLiveClassCreation, async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const {
      course_id,
      title,
      description,
      scheduled_date,
      start_time,
      duration_minutes,
      recording_enabled = false,
      max_participants = 50,
      timezone = 'UTC'
    } = req.body;

    // Verify course exists and belongs to user's organization
    const course = await Course.findOne({
      _id: course_id,
      organization_id: orgId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
        message: 'Course not found or access denied'
      });
    }

    // Check if instructor is assigned to this course or is admin
    if (req.user.role !== 'admin' && course.instructor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only create live classes for courses you teach'
      });
    }

    // Create live class
    const liveClass = new LiveClass({
      organization_id: orgId,
      course_id,
      instructor_id: req.user._id,
      title,
      description,
      scheduled_date: new Date(scheduled_date),
      start_time,
      duration_minutes,
      recording_enabled,
      max_participants,
      timezone
    });

    await liveClass.save();

    // Populate course and instructor details
    await liveClass.populate([
      { path: 'course_id', select: 'title' },
      { path: 'instructor_id', select: 'name email' }
    ]);

    // Send response FIRST — email runs in background (non-blocking)
    res.status(201).json({
      success: true,
      data: liveClass,
      message: 'Live class created successfully'
    });

    // Best-effort: broadcast to college batch students if this course is mapped to a Subject
    setImmediate(async () => {
      try {
        const Subject = require('../models/Subject');
        const User = require('../models/User');
        const Notification = require('../models/Notification');

        let socketService = null;
        try { socketService = require('../services/socketService'); } catch (_) { }

        const orgId = req.user.organization_id?._id || req.user.organization_id;
        const subject = await Subject.findOne({ organizationId: orgId, contentCourseId: course_id, isActive: true })
          .select('batchId name code')
          .lean();

        if (!subject?.batchId) return;

        const students = await User.find({
          organization_id: orgId,
          role: 'student',
          isActive: true,
          'profile.batch': subject.batchId
        }).select('_id').lean();

        if (!students.length) return;

        await Notification.insertMany(
          students.map(s => ({
            organization_id: orgId,
            recipient_id: s._id,
            sender_id: req.user._id,
            type: 'live_class_reminder',
            title: 'Live Class Scheduled',
            message: `${req.user.name || 'Instructor'} scheduled a live class: ${title}`,
            data: {
              entityType: 'live_class',
              liveClassId: liveClass._id,
              courseId: course_id,
              subjectId: subject._id,
              subjectName: subject.name,
              subjectCode: subject.code,
              meeting_url: liveClass.meeting_url
            },
            priority: 'high',
            action_url: `/student/live-classes/${liveClass._id}`,
            action_text: 'Join Live Class'
          })),
          { ordered: false }
        );

        if (socketService?.io) {
          socketService.sendNotificationToUsers(
            students.map(s => String(s._id)),
            {
              type: 'live_class_reminder',
              title: 'Live Class Scheduled',
              message: `${req.user.name || 'Instructor'} scheduled a live class: ${title}`,
              data: { liveClassId: liveClass._id, meeting_url: liveClass.meeting_url }
            }
          );
        }
      } catch (_) {
        // ignore broadcast failures
      }
    });

    // --- Background: notify enrolled students --- //
    setImmediate(async () => {
      try {
        const User = require('../models/User');

        // Get all active enrollments for this course in the same org
        const enrollments = await Enrollment.find({
          course_id: course_id,
          organization_id: req.user.organization_id,
          status: 'active'
        }).select('student_id').lean();

        if (!enrollments.length) {
          console.log(`[LiveClass] No enrolled students to notify for course ${course_id}`);
          return;
        }

        const studentIds = enrollments.map(e => e.student_id);

        // Fetch student email + name
        const students = await User.find({
          _id: { $in: studentIds },
          isActive: true,
          is_deleted: { $ne: true }
        }).select('email name').lean();

        if (!students.length) return;

        // Build readable date/time string
        const classDate = new Date(scheduled_date);
        const dateStr = classDate.toLocaleDateString('en-IN', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        const instructorName = liveClass.instructor_id?.name || req.user.name || 'Your Instructor';
        const courseTitle = liveClass.course_id?.title || 'Your enrolled course';

        // Compose HTML email
        const makeHtml = (studentName) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
  .container { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 32px 32px 24px; }
  .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
  .header p { color: #c7d2fe; margin: 6px 0 0; font-size: 14px; }
  .body { padding: 28px 32px; }
  .body p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
  .info-card { background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 18px 20px; margin: 20px 0; }
  .info-row { display: flex; margin-bottom: 10px; font-size: 14px; }
  .info-row:last-child { margin-bottom: 0; }
  .info-label { color: #6366f1; font-weight: 700; min-width: 110px; }
  .info-value { color: #111827; }
  .cta { display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 8px 0 20px; }
  .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 18px 32px; text-align: center; color: #9ca3af; font-size: 12px; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>📹 Live Class Scheduled!</h1>
    <p>${courseTitle}</p>
  </div>
  <div class="body">
    <p>Hi <strong>${studentName}</strong>,</p>
    <p>A new live session has been scheduled for your course. Make sure to join on time!</p>
    <div class="info-card">
      <div class="info-row"><span class="info-label">📚 Class:</span><span class="info-value">${title}</span></div>
      <div class="info-row"><span class="info-label">📖 Course:</span><span class="info-value">${courseTitle}</span></div>
      <div class="info-row"><span class="info-label">👨‍🏫 Instructor:</span><span class="info-value">${instructorName}</span></div>
      <div class="info-row"><span class="info-label">📅 Date:</span><span class="info-value">${dateStr}</span></div>
      <div class="info-row"><span class="info-label">⏰ Time:</span><span class="info-value">${start_time} (${timezone})</span></div>
      <div class="info-row"><span class="info-label">⏱️ Duration:</span><span class="info-value">${duration_minutes} minutes</span></div>
    </div>
    <p style="color:#6b7280;font-size:13px;">Log in to the LMS to join the class when it goes live.</p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} Smart LMS. You're receiving this because you're enrolled in the course.</div>
</div>
</body></html>`;

        const emailPayloads = students.map(student => ({
          to: student.email,
          subject: `📹 Live Class Scheduled: ${title} — ${dateStr} at ${start_time}`,
          html: makeHtml(student.name || 'Student'),
          text: `Hi ${student.name || 'Student'},\n\nA live class has been scheduled:\n\nClass: ${title}\nCourse: ${courseTitle}\nInstructor: ${instructorName}\nDate: ${dateStr}\nTime: ${start_time} (${timezone})\nDuration: ${duration_minutes} minutes\n\nLog in to join when the class goes live.\n\nSmart LMS`
        }));

        const result = await emailService.sendBulkEmails(emailPayloads, 20, 500);
        console.log(`[LiveClass] Notified ${result.successful}/${result.total} students for live class "${title}"`);
      } catch (emailErr) {
        // Never crash the app over email failures
        console.error('[LiveClass] Failed to send student notifications:', emailErr.message);
      }
    });

  } catch (error) {
    console.error('Live class creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create live class'
    });
  }
});

// GET /api/live-classes - List live classes with filtering
router.get('/', auth, async (req, res) => {
  try {
    const {
      course_id,
      instructor_id,
      status,
      upcoming,
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query with organization isolation
    const query = {
      organization_id: req.user.organization_id,
      is_active: true
    };

    if (course_id) {
      query.course_id = course_id;
    }

    if (instructor_id) {
      query.instructor_id = instructor_id;
    }

    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      query.scheduled_date = { $gte: new Date() };
      query.status = { $in: ['scheduled', 'live'] };
    }

    // For students, only show live classes from courses they're enrolled in
    if (req.user.role === 'student') {
      const enrollments = await Enrollment.find({
        student_id: req.user._id,
        organization_id: req.user.organization_id,
        status: 'active'
      }).select('course_id');

      const enrolledCourseIds = enrollments.map(e => e.course_id);
      query.course_id = { $in: enrolledCourseIds };
    }

    const [liveClasses, total] = await Promise.all([
      LiveClass.find(query)
        .populate('course_id', 'title')
        .populate('instructor_id', 'full_name email')
        .sort({ scheduled_date: upcoming === 'true' ? 1 : -1 })
        .skip(skip)
        .limit(limitNum),
      LiveClass.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        live_classes: liveClasses,
        pagination: {
          current_page: pageNum,
          total_pages: Math.ceil(total / limitNum),
          total_items: total,
          items_per_page: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Live classes listing error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch live classes'
    });
  }
});

// GET /api/live-classes/:id - Get live class details
router.get('/:id', auth, [
  param('id').isMongoId().withMessage('Valid live class ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid live class ID'
      });
    }

    const liveClass = await LiveClass.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
      is_active: true
    })
      .populate('course_id', 'title description')
      .populate('instructor_id', 'full_name email');

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: 'Live class not found',
        message: 'Live class not found or access denied'
      });
    }

    // Check if user can access this live class
    const accessCheck = await liveClass.canUserAccess(req.user);
    if (!accessCheck.canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this live class'
      });
    }

    // Add additional info for response
    const responseData = {
      ...liveClass.toObject(),
      can_join_now: liveClass.canJoinNow(),
      is_currently_live: liveClass.isCurrentlyLive(),
      current_participants: liveClass.current_participants,
      total_attendees: liveClass.total_attendees
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Live class fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch live class'
    });
  }
});

// PUT /api/live-classes/:id - Update live class
router.put('/:id', auth, checkInstructorPermission, validateLiveClassUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const liveClass = await LiveClass.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
      is_active: true
    });

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: 'Live class not found',
        message: 'Live class not found or access denied'
      });
    }

    // Check if user can modify this live class (instructor or admin)
    if (req.user.role !== 'admin' && liveClass.instructor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only modify your own live classes'
      });
    }

    // Don't allow updates to live or completed classes
    if (['live', 'completed'].includes(liveClass.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update live class',
        message: 'Cannot update live or completed classes'
      });
    }

    // Update live class
    const updateFields = {};
    const allowedFields = ['title', 'description', 'scheduled_date', 'start_time', 'duration_minutes', 'recording_enabled', 'max_participants'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    Object.assign(liveClass, updateFields);
    await liveClass.save();

    await liveClass.populate([
      { path: 'course_id', select: 'title' },
      { path: 'instructor_id', select: 'full_name email' }
    ]);

    res.json({
      success: true,
      data: liveClass,
      message: 'Live class updated successfully'
    });

  } catch (error) {
    console.error('Live class update error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to update live class'
    });
  }
});

// DELETE /api/live-classes/:id - Cancel live class
router.delete('/:id', auth, checkInstructorPermission, [
  param('id').isMongoId().withMessage('Valid live class ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid live class ID'
      });
    }

    const liveClass = await LiveClass.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
      is_active: true
    });

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: 'Live class not found',
        message: 'Live class not found or access denied'
      });
    }

    // Check if user can cancel this live class (instructor or admin)
    if (req.user.role !== 'admin' && liveClass.instructor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only cancel your own live classes'
      });
    }

    // Don't allow cancellation of completed classes
    if (liveClass.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel live class',
        message: 'Cannot cancel completed classes'
      });
    }

    // Cancel the live class
    liveClass.status = 'cancelled';
    await liveClass.save();

    res.json({
      success: true,
      message: 'Live class cancelled successfully'
    });

  } catch (error) {
    console.error('Live class cancellation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to cancel live class'
    });
  }
});

// GET /api/live-classes/:id/join - Join live class
router.get('/:id/join', auth, [
  param('id').isMongoId().withMessage('Valid live class ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid live class ID'
      });
    }

    const liveClass = await LiveClass.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
      is_active: true
    }).populate('course_id', 'title');

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: 'Live class not found',
        message: 'Live class not found or access denied'
      });
    }

    // Check if user can access this live class
    const accessCheck = await liveClass.canUserAccess(req.user);
    if (!accessCheck.canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You must be enrolled in this course to join the live class',
        reason: accessCheck.reason
      });
    }

    // Check if class is cancelled
    if (liveClass.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Class cancelled',
        message: 'This live class has been cancelled'
      });
    }

    // Check if user can join now (time window check)
    if (!liveClass.canJoinNow()) {
      const now = new Date();
      const classDate = new Date(liveClass.scheduled_date);
      const [hours, minutes] = liveClass.start_time.split(':').map(Number);
      classDate.setHours(hours, minutes, 0, 0);

      if (now < classDate) {
        const minutesUntilStart = Math.ceil((classDate - now) / (1000 * 60));
        return res.status(403).json({
          success: false,
          error: 'Class not started',
          message: `Live class starts in ${minutesUntilStart} minutes. Please wait.`,
          can_join: false,
          minutes_until_start: minutesUntilStart
        });
      } else {
        return res.status(403).json({
          success: false,
          error: 'Class ended',
          message: 'This live class has already ended',
          can_join: false
        });
      }
    }

    // Check capacity for students (instructors and admins can always join)
    if (req.user.role === 'student') {
      if (liveClass.current_participants >= liveClass.max_participants) {
        return res.status(400).json({
          success: false,
          error: 'Class full',
          message: 'This live class has reached maximum capacity',
          can_join: false,
          current_participants: liveClass.current_participants,
          max_participants: liveClass.max_participants
        });
      }

      // Add attendance record for student
      const attendanceResult = liveClass.addAttendance(req.user._id);
      if (!attendanceResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Join failed',
          message: attendanceResult.message,
          can_join: false
        });
      }

      // Update class status to live if it's the first participant
      if (liveClass.status === 'scheduled') {
        liveClass.status = 'live';
      }

      await liveClass.save();
    }

    // Return meeting details
    res.json({
      success: true,
      data: {
        meeting_url: liveClass.meeting_url,
        meeting_room_id: liveClass.meeting_room_id,
        class_title: liveClass.title,
        course_title: liveClass.course_id.title,
        instructor_name: req.user.role === 'student' ? 'Instructor' : req.user.full_name,
        recording_enabled: liveClass.recording_enabled,
        can_join: true,
        current_participants: liveClass.current_participants + (req.user.role === 'student' ? 1 : 0),
        max_participants: liveClass.max_participants
      },
      message: 'You can now join the live class'
    });

  } catch (error) {
    console.error('Live class join error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to join live class'
    });
  }
});

// POST /api/live-classes/:id/attendance - Track attendance (join/leave events)
router.post('/:id/attendance', auth, [
  param('id').isMongoId().withMessage('Valid live class ID is required'),
  body('action').isIn(['join', 'leave']).withMessage('Action must be join or leave'),
  body('timestamp').optional().isISO8601().withMessage('Timestamp must be valid ISO date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid input parameters',
        details: errors.array()
      });
    }

    const { action, timestamp } = req.body;
    const eventTime = timestamp ? new Date(timestamp) : new Date();

    const liveClass = await LiveClass.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
      is_active: true
    });

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: 'Live class not found',
        message: 'Live class not found or access denied'
      });
    }

    // Check if user can access this live class
    const accessCheck = await liveClass.canUserAccess(req.user);
    if (!accessCheck.canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this live class'
      });
    }

    let result;
    if (action === 'join') {
      result = liveClass.addAttendance(req.user._id, eventTime);

      // Update class status to live if it's the first participant
      if (result.success && liveClass.status === 'scheduled') {
        liveClass.status = 'live';
      }
    } else if (action === 'leave') {
      result = liveClass.markStudentLeft(req.user._id, eventTime);
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Attendance tracking failed',
        message: result.message
      });
    }

    await liveClass.save();

    res.json({
      success: true,
      data: {
        action: action,
        timestamp: eventTime,
        current_participants: liveClass.current_participants,
        total_attendees: liveClass.total_attendees
      },
      message: result.message
    });

  } catch (error) {
    console.error('Attendance tracking error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to track attendance'
    });
  }
});

// GET /api/live-classes/:id/attendance - Get attendance for live class (instructor/admin only)
router.get('/:id/attendance', auth, checkInstructorPermission, [
  param('id').isMongoId().withMessage('Valid live class ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid live class ID'
      });
    }

    const liveClass = await LiveClass.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
      is_active: true
    }).populate('attendance.student_id', 'full_name email');

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: 'Live class not found',
        message: 'Live class not found or access denied'
      });
    }

    // Check if user can view attendance (instructor or admin)
    if (req.user.role !== 'admin' && liveClass.instructor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only view attendance for your own live classes'
      });
    }

    const attendanceData = {
      live_class_id: liveClass._id,
      title: liveClass.title,
      scheduled_date: liveClass.scheduled_date,
      total_attendees: liveClass.total_attendees,
      current_participants: liveClass.current_participants,
      attendance_records: liveClass.attendance.map(att => ({
        student_id: att.student_id._id,
        student_name: att.student_id.full_name,
        student_email: att.student_id.email,
        join_time: att.join_time,
        leave_time: att.leave_time,
        duration_minutes: att.duration_minutes,
        is_active: att.is_active
      }))
    };

    res.json({
      success: true,
      data: attendanceData
    });

  } catch (error) {
    console.error('Attendance fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch attendance'
    });
  }
});

/**
 * POST /api/live-classes/:id/recording/start
 * Start recording for a live class (instructors only)
 */
router.post('/:id/recording/start', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, role } = req.user;

    // Only instructors and admins can start recordings
    if (!['instructor', 'admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only instructors and admins can start recordings'
      });
    }

    const liveClass = await LiveClass.findOne({
      _id: id,
      organization_id: organization_id,
      is_active: true
    });

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: 'Live class not found',
        message: 'Live class not found in your organization'
      });
    }

    // Check if user is the instructor or admin
    if (role !== 'admin' && liveClass.instructor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only the class instructor or admin can start recording'
      });
    }

    // Check if class is currently live
    if (!liveClass.isCurrentlyLive()) {
      return res.status(400).json({
        success: false,
        error: 'Class not live',
        message: 'Recording can only be started during live class'
      });
    }

    const result = liveClass.startRecording();
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message,
        message: 'Failed to start recording'
      });
    }

    await liveClass.save();

    res.json({
      success: true,
      data: {
        recording_status: liveClass.recording.status,
        started_at: liveClass.recording.started_at
      },
      message: 'Recording started successfully'
    });

  } catch (error) {
    console.error('Start recording error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to start recording'
    });
  }
});

/**
 * POST /api/live-classes/:id/recording/stop
 * Stop recording for a live class (instructors only)
 */
router.post('/:id/recording/stop', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, role } = req.user;
    const { recording_url, file_path, file_size_bytes, duration_minutes } = req.body;

    // Only instructors and admins can stop recordings
    if (!['instructor', 'admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only instructors and admins can stop recordings'
      });
    }

    const liveClass = await LiveClass.findOne({
      _id: id,
      organization_id: organization_id,
      is_active: true
    });

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: 'Live class not found',
        message: 'Live class not found in your organization'
      });
    }

    // Check if user is the instructor or admin
    if (role !== 'admin' && liveClass.instructor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only the class instructor or admin can stop recording'
      });
    }

    const result = liveClass.completeRecording({
      url: recording_url,
      file_path: file_path,
      file_size_bytes: file_size_bytes,
      duration_minutes: duration_minutes
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message,
        message: 'Failed to stop recording'
      });
    }

    await liveClass.save();

    res.json({
      success: true,
      data: {
        recording_status: liveClass.recording.status,
        completed_at: liveClass.recording.completed_at,
        duration_minutes: liveClass.recording.duration_minutes
      },
      message: 'Recording stopped and processing'
    });

  } catch (error) {
    console.error('Stop recording error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to stop recording'
    });
  }
});

/**
 * PUT /api/live-classes/:id/recording/ready
 * Mark recording as ready for viewing (system/admin only)
 */
router.put('/:id/recording/ready', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, role } = req.user;
    const { final_url, final_file_size } = req.body;

    // Only admins can mark recordings as ready
    if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only admins can mark recordings as ready'
      });
    }

    const liveClass = await LiveClass.findOne({
      _id: id,
      organization_id: organization_id,
      is_active: true
    });

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: 'Live class not found',
        message: 'Live class not found in your organization'
      });
    }

    // Update final recording details if provided
    if (final_url) liveClass.recording.url = final_url;
    if (final_file_size) liveClass.recording.file_size_bytes = final_file_size;

    const result = liveClass.markRecordingReady();
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message,
        message: 'Failed to mark recording as ready'
      });
    }

    await liveClass.save();

    res.json({
      success: true,
      data: {
        recording_status: liveClass.recording.status,
        recording_url: liveClass.recording.url
      },
      message: 'Recording is now available for viewing'
    });

  } catch (error) {
    console.error('Mark recording ready error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to mark recording as ready'
    });
  }
});

/**
 * GET /api/live-classes/:id/recording
 * Get recording details and access URL
 */
router.get('/:id/recording', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    const liveClass = await LiveClass.findOne({
      _id: id,
      organization_id: organization_id,
      is_active: true
    }).populate('course_id', 'title').populate('instructor_id', 'full_name');

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: 'Live class not found',
        message: 'Live class not found in your organization'
      });
    }

    // Check if user can access recording
    const accessCheck = await liveClass.canAccessRecording(req.user);
    if (!accessCheck.canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this recording'
      });
    }

    // Track access
    await liveClass.trackRecordingAccess();

    res.json({
      success: true,
      data: {
        class_info: {
          id: liveClass._id,
          title: liveClass.title,
          course_title: liveClass.course_id.title,
          instructor_name: liveClass.instructor_id.full_name,
          scheduled_date: liveClass.scheduled_date,
          duration_minutes: liveClass.duration_minutes
        },
        recording: {
          status: liveClass.recording.status,
          url: liveClass.recording.url,
          duration_minutes: liveClass.recording.duration_minutes,
          file_size_bytes: liveClass.recording.file_size_bytes,
          started_at: liveClass.recording.started_at,
          completed_at: liveClass.recording.completed_at,
          download_count: liveClass.recording.download_count,
          access_reason: accessCheck.reason
        }
      },
      message: 'Recording details retrieved successfully'
    });

  } catch (error) {
    console.error('Get recording error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve recording details'
    });
  }
});

/**
 * PUT /api/live-classes/:id/recording/permissions
 * Update recording access permissions (instructors and admins only)
 */
router.put('/:id/recording/permissions', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, role } = req.user;
    const { instructor_only, enrolled_students, organization_admins } = req.body;

    // Only instructors and admins can update permissions
    if (!['instructor', 'admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only instructors and admins can update recording permissions'
      });
    }

    const liveClass = await LiveClass.findOne({
      _id: id,
      organization_id: organization_id,
      is_active: true
    });

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: 'Live class not found',
        message: 'Live class not found in your organization'
      });
    }

    // Check if user is the instructor or admin
    if (role !== 'admin' && liveClass.instructor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only the class instructor or admin can update permissions'
      });
    }

    // Update permissions
    if (typeof instructor_only === 'boolean') {
      liveClass.recording.access_permissions.instructor_only = instructor_only;
    }
    if (typeof enrolled_students === 'boolean') {
      liveClass.recording.access_permissions.enrolled_students = enrolled_students;
    }
    if (typeof organization_admins === 'boolean') {
      liveClass.recording.access_permissions.organization_admins = organization_admins;
    }

    await liveClass.save();

    res.json({
      success: true,
      data: {
        access_permissions: liveClass.recording.access_permissions
      },
      message: 'Recording permissions updated successfully'
    });

  } catch (error) {
    console.error('Update recording permissions error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to update recording permissions'
    });
  }
});

/**
 * GET /api/live-classes/recordings
 * Get all available recordings for the organization
 */
router.get('/recordings', auth, async (req, res) => {
  try {
    const { organization_id, role } = req.user;
    const { course_id, instructor_id, status, limit = 20, page = 1 } = req.query;

    // Build query
    const query = {
      organization_id: organization_id,
      recording_enabled: true,
      'recording.status': { $in: ['completed', 'processing'] },
      is_active: true
    };

    if (course_id) query.course_id = course_id;
    if (instructor_id) query.instructor_id = instructor_id;
    if (status) query['recording.status'] = status;

    // If not admin, only show recordings user can access
    if (role !== 'admin') {
      query.$or = [
        { instructor_id: req.user._id }, // User is instructor
        { 'recording.access_permissions.enrolled_students': true } // Students can access
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const recordings = await LiveClass.find(query)
      .populate('course_id', 'title')
      .populate('instructor_id', 'full_name')
      .sort({ 'recording.completed_at': -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Filter recordings based on user access
    const accessibleRecordings = [];
    for (const recording of recordings) {
      const accessCheck = await recording.canAccessRecording(req.user);
      if (accessCheck.canAccess) {
        accessibleRecordings.push({
          id: recording._id,
          title: recording.title,
          course_title: recording.course_id.title,
          instructor_name: recording.instructor_id.full_name,
          scheduled_date: recording.scheduled_date,
          recording: {
            status: recording.recording.status,
            duration_minutes: recording.recording.duration_minutes,
            file_size_bytes: recording.recording.file_size_bytes,
            completed_at: recording.recording.completed_at,
            download_count: recording.recording.download_count
          }
        });
      }
    }

    const totalRecordings = await LiveClass.countDocuments(query);

    res.json({
      success: true,
      data: {
        recordings: accessibleRecordings,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalRecordings / parseInt(limit)),
          total_items: totalRecordings,
          items_per_page: parseInt(limit)
        }
      },
      message: 'Recordings retrieved successfully'
    });

  } catch (error) {
    console.error('Get recordings error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve recordings'
    });
  }
});

module.exports = router;