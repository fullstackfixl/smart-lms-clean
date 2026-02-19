const BaseController = require('../core/BaseController');
const LiveClass = require('../models/LiveClass');
const Course = require('../models/Course');
const User = require('../models/User');
const Notification = require('../models/Notification');
const emailService = require('../utils/emailService');

class LiveClassController extends BaseController {
  constructor() {
    super(null);
  }

  // INSTRUCTOR ENDPOINTS

  /**
   * POST /instructor/live-classes
   * Schedule a new live class
   */
  scheduleClass = this.asyncHandler(async (req, res) => {
    const { title, description, course_id, scheduled_date, start_time, duration_minutes } = req.body;
    const user = req.user;

    console.log('📅 [LiveClass] Schedule request received:', {
      title,
      course_id,
      scheduled_date,
      start_time,
      duration_minutes,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        organization_id: user.organization_id
      }
    });

    // Validation
    if (!title || !course_id || !scheduled_date || !start_time || !duration_minutes) {
      console.error('❌ [LiveClass] Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, course_id, scheduled_date, start_time, duration_minutes'
      });
    }

    // Verify course belongs to instructor
    const course = await Course.findOne({
      _id: course_id,
      organization_id: user.organization_id,
      instructor_id: user._id,
      is_deleted: false
    });

    console.log('🔍 [LiveClass] Course lookup result:', {
      found: !!course,
      courseId: course_id,
      expectedOrgId: user.organization_id,
      expectedInstructorId: user._id
    });

    if (!course) {
      // Try to find the course without instructor filter to see if it exists
      const anyCourse = await Course.findOne({ _id: course_id, is_deleted: false });
      
      if (!anyCourse) {
        console.error('❌ [LiveClass] Course not found at all');
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }
      
      console.error('❌ [LiveClass] Course found but permission denied:', {
        courseOrgId: anyCourse.organization_id,
        userOrgId: user.organization_id,
        courseInstructorId: anyCourse.instructor_id,
        userId: user._id,
        orgMatch: anyCourse.organization_id?.toString() === user.organization_id?.toString(),
        instructorMatch: anyCourse.instructor_id?.toString() === user._id?.toString()
      });
      
      return res.status(404).json({
        success: false,
        message: 'Course not found or you do not have permission to schedule classes for this course'
      });
    }

    console.log('✅ [LiveClass] Course verified, creating live class...');

    // Create live class
    const liveClass = await LiveClass.create({
      organization_id: user.organization_id,
      course_id: course._id,
      instructor_id: user._id,
      title,
      description,
      scheduled_date: new Date(scheduled_date),
      start_time,
      duration_minutes: parseInt(duration_minutes),
      status: 'scheduled'
    });

    console.log('✅ [LiveClass] Live class created successfully:', liveClass._id);

    // Fetch all students in the organization (non-blocking)
    setImmediate(async () => {
      try {
        const students = await User.find({
          organization_id: user.organization_id,
          role: 'student',
          isActive: true
        }).select('_id name email');

        // Create notifications and send emails
        for (const student of students) {
          try {
            // Create in-app notification
            await Notification.create({
              organization_id: user.organization_id,
              recipient_id: student._id,
              sender_id: user._id,
              type: 'live_class_reminder',
              title: 'Live Class Scheduled',
              message: `${user.name} has scheduled a live class "${title}" for ${course.title}`,
              data: {
                live_class_id: liveClass._id,
                course_id: course._id,
                course_title: course.title,
                instructor_name: user.name,
                scheduled_date: liveClass.scheduled_date,
                start_time: liveClass.start_time,
                duration_minutes: liveClass.duration_minutes
              },
              priority: 'high',
              action_url: `/student/live-classes/${liveClass._id}`,
              action_text: 'View Details'
            });

            // Send email notification
            const formattedDate = new Date(scheduled_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            await emailService.sendPlainEmail({
              to: student.email,
              subject: `Live Class Scheduled: ${title}`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c; }
                    .detail-item { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
                    .detail-item:last-child { border-bottom: none; }
                    .label { font-weight: bold; color: #ea580c; display: inline-block; width: 120px; }
                    .value { color: #1f2937; }
                    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                    .button { display: inline-block; background: #ea580c; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-size: 18px; font-weight: bold; }
                    .meeting-link { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border: 2px solid #fbbf24; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1 style="margin: 0; font-size: 28px;">📅 Live Class Scheduled</h1>
                    </div>
                    <div class="content">
                      <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>${student.name}</strong>,</p>
                      <p style="font-size: 16px; margin-bottom: 20px;">
                        <strong>${user.name}</strong> has scheduled a live class for <strong>${course.title}</strong>.
                      </p>
                      
                      <div class="details">
                        <h3 style="margin-top: 0; color: #ea580c;">📚 Class Details</h3>
                        <div class="detail-item">
                          <span class="label">Class Title:</span>
                          <span class="value">${title}</span>
                        </div>
                        ${description ? `
                        <div class="detail-item">
                          <span class="label">Description:</span>
                          <span class="value">${description}</span>
                        </div>
                        ` : ''}
                        <div class="detail-item">
                          <span class="label">📅 Date:</span>
                          <span class="value">${formattedDate}</span>
                        </div>
                        <div class="detail-item">
                          <span class="label">🕐 Time:</span>
                          <span class="value">${start_time}</span>
                        </div>
                        <div class="detail-item">
                          <span class="label">⏱️ Duration:</span>
                          <span class="value">${duration_minutes} minutes</span>
                        </div>
                        <div class="detail-item">
                          <span class="label">📖 Course:</span>
                          <span class="value">${course.title}</span>
                        </div>
                        <div class="detail-item">
                          <span class="label">👨‍🏫 Instructor:</span>
                          <span class="value">${user.name}</span>
                        </div>
                      </div>

                      <div class="meeting-link">
                        <h3 style="margin-top: 0; color: #92400e;">🎥 Join Meeting</h3>
                        <p style="margin: 10px 0; color: #78350f;">Click the button below to join the live class:</p>
                        <div style="text-align: center;">
                          <a href="${liveClass.meeting_url}" class="button" style="color: white;">
                            Join Live Class
                          </a>
                        </div>
                        <p style="margin: 10px 0; font-size: 12px; color: #78350f;">
                          Meeting Link: <a href="${liveClass.meeting_url}" style="color: #ea580c;">${liveClass.meeting_url}</a>
                        </p>
                      </div>

                      <p style="font-size: 16px; margin-top: 20px;">
                        <strong>⚠️ Important:</strong> Join on time. You can also access the meeting from your dashboard.
                      </p>

                      <div style="text-align: center;">
                        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/student/live-classes" style="color: #ea580c; text-decoration: underline;">
                          View All Live Classes
                        </a>
                      </div>
                    </div>
                    <div class="footer">
                      <p>This is an automated notification from Smart LMS.</p>
                      <p>If you have any questions, please contact your instructor.</p>
                    </div>
                  </div>
                </body>
                </html>
              `,
              text: `
Live Class Scheduled

Hello ${student.name},

${user.name} has scheduled a live class for ${course.title}.

Class Details:
- Title: ${title}
${description ? `- Description: ${description}\n` : ''}- Date: ${formattedDate}
- Time: ${start_time}
- Duration: ${duration_minutes} minutes
- Course: ${course.title}
- Instructor: ${user.name}

JOIN MEETING:
${liveClass.meeting_url}

Please join the class on time. You can also access the meeting from your dashboard.

Visit: ${process.env.CLIENT_URL || 'http://localhost:3000'}/student/live-classes
              `
            });
          } catch (error) {
            console.error(`Failed to notify student ${student.email}:`, error.message);
          }
        }
      } catch (error) {
        console.error('Failed to send notifications:', error.message);
      }
    });

    this.sendSuccess(res, {
      live_class: liveClass
    }, 'Live class scheduled successfully', 201);
  });

  /**
   * GET /instructor/live-classes
   * Get all live classes for instructor
   */
  getInstructorClasses = this.asyncHandler(async (req, res) => {
    const user = req.user;
    const { status, page = 1, limit = 20 } = req.query;

    const query = {
      organization_id: user.organization_id,
      instructor_id: user._id,
      is_active: true
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [classes, total] = await Promise.all([
      LiveClass.find(query)
        .populate('course_id', 'title')
        .sort({ scheduled_date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      LiveClass.countDocuments(query)
    ]);

    this.sendSuccess(res, {
      classes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Instructor classes retrieved successfully');
  });

  /**
   * PATCH /instructor/live-classes/:id
   * Update live class schedule/details
   */
  updateClass = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const updates = req.body;

    // Find class and verify ownership
    const liveClass = await LiveClass.findOne({
      _id: id,
      organization_id: user.organization_id,
      instructor_id: user._id,
      is_active: true
    });

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found or you do not have permission to update it'
      });
    }

    // Don't allow updating completed or cancelled classes
    if (liveClass.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed live class'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'scheduled_date', 'start_time', 'duration_minutes'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        liveClass[field] = updates[field];
      }
    });

    await liveClass.save();

    this.sendSuccess(res, liveClass, 'Live class updated successfully');
  });

  /**
   * DELETE /instructor/live-classes/:id
   * Cancel live class
   */
  cancelClass = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    // Find class and verify ownership
    const liveClass = await LiveClass.findOne({
      _id: id,
      organization_id: user.organization_id,
      instructor_id: user._id,
      is_active: true
    });

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found or you do not have permission to cancel it'
      });
    }

    // Update status to cancelled
    liveClass.status = 'cancelled';
    await liveClass.save();

    this.sendSuccess(res, null, 'Live class cancelled successfully');
  });

  // STUDENT ENDPOINTS

  /**
   * GET /student/live-classes/upcoming
   * Get upcoming live classes for student
   */
  getUpcomingClasses = this.asyncHandler(async (req, res) => {
    const user = req.user;
    const now = new Date();

    const classes = await LiveClass.find({
      organization_id: user.organization_id,
      scheduled_date: { $gte: now },
      status: { $in: ['scheduled', 'live'] },
      is_active: true
    })
      .populate('course_id', 'title')
      .populate('instructor_id', 'name email')
      .sort({ scheduled_date: 1 })
      .limit(50);

    this.sendSuccess(res, { classes }, 'Upcoming classes retrieved successfully');
  });

  /**
   * POST /student/live-classes/:id/join
   * Join a live class
   */
  joinClass = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    // Verify student role
    if (user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can join live classes'
      });
    }

    // Find class
    const liveClass = await LiveClass.findOne({
      _id: id,
      is_active: true
    }).populate('course_id', 'title');

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found'
      });
    }

    // Verify organization match
    if (liveClass.organization_id.toString() !== user.organization_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to join this class'
      });
    }

    // Check if class is cancelled
    if (liveClass.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This class has been cancelled'
      });
    }

    // Check if class is completed
    if (liveClass.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This class has already been completed'
      });
    }

    // Return meeting link
    this.sendSuccess(res, {
      meeting_url: liveClass.meeting_url,
      meeting_room_id: liveClass.meeting_room_id,
      title: liveClass.title,
      course_title: liveClass.course_id.title,
      scheduled_date: liveClass.scheduled_date,
      start_time: liveClass.start_time,
      duration_minutes: liveClass.duration_minutes
    }, 'Join link retrieved successfully');
  });

  // NOTIFICATION ENDPOINTS

  /**
   * GET /notifications
   * Get notifications for current user
   */
  getNotifications = this.asyncHandler(async (req, res) => {
    const user = req.user;
    const { status, type, page = 1, limit = 50 } = req.query;

    const query = {
      recipient_id: user._id,
      organization_id: user.organization_id,
      is_active: true
    };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('sender_id', 'name email')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({
        recipient_id: user._id,
        organization_id: user.organization_id,
        status: { $in: ['pending', 'sent'] },
        'channels.in_app.read': false,
        is_active: true
      })
    ]);

    this.sendSuccess(res, {
      notifications,
      unread_count: unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Notifications retrieved successfully');
  });

  /**
   * PATCH /notifications/:id/read
   * Mark notification as read
   */
  markAsRead = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const notification = await Notification.findOne({
      _id: id,
      recipient_id: user._id,
      organization_id: user.organization_id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    this.sendSuccess(res, notification, 'Notification marked as read');
  });

  /**
   * PATCH /notifications/read-all
   * Mark all notifications as read
   */
  markAllAsRead = this.asyncHandler(async (req, res) => {
    const user = req.user;

    const result = await Notification.updateMany(
      {
        recipient_id: user._id,
        organization_id: user.organization_id,
        status: { $in: ['pending', 'sent'] },
        'channels.in_app.read': false,
        is_active: true
      },
      {
        status: 'read',
        'channels.in_app.read': true,
        'channels.in_app.read_at': new Date()
      }
    );

    this.sendSuccess(res, {
      marked_count: result.modifiedCount
    }, 'All notifications marked as read');
  });
}

module.exports = new LiveClassController();
