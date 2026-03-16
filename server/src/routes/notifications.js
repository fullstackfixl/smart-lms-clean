const express = require('express');
const { authMiddleware: auth } = require('../middleware/auth');
const notificationService = require('../utils/notificationService');
const Notification = require('../models/Notification');

const router = express.Router();

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 */
router.get('/', auth, async (req, res) => {
  try {
    const { _id: userId, organization_id } = req.user;
    const { 
      status, 
      type, 
      priority, 
      limit = 20, 
      page = 1,
      unread_only = false 
    } = req.query;

    // Build filters
    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (priority) filters.priority = priority;
    if (unread_only === 'true') {
      filters.status = { $in: ['pending', 'sent'] };
    }

    // Get notifications with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const notifications = await Notification.findForUser(userId, organization_id, filters)
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const totalNotifications = await Notification.countDocuments({
      recipient_id: userId,
      organization_id: organization_id,
      is_active: true,
      ...filters
    });

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      recipient_id: userId,
      organization_id: organization_id,
      status: { $in: ['pending', 'sent'] },
      is_active: true
    });

    res.json({
      success: true,
      data: {
        notifications: notifications.map(notification => ({
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          status: notification.status,
          data: notification.data,
          action_url: notification.action_url,
          action_text: notification.action_text,
          channels: notification.channels,
          created_at: notification.created_at,
          expires_at: notification.expires_at,
          sender: notification.sender_id ? {
            id: notification.sender_id._id,
            name: notification.sender_id.full_name
          } : null
        })),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalNotifications / parseInt(limit)),
          total_items: totalNotifications,
          items_per_page: parseInt(limit)
        },
        unread_count: unreadCount
      },
      message: 'Notifications retrieved successfully'
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve notifications'
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', auth, async (req, res) => {
  try {
    const { _id: userId, organization_id } = req.user;

    const unreadCount = await Notification.countDocuments({
      recipient_id: userId,
      organization_id: organization_id,
      status: { $in: ['pending', 'sent'] },
      is_active: true
    });

    res.json({
      success: true,
      data: {
        unread_count: unreadCount
      },
      message: 'Unread count retrieved successfully'
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve unread count'
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { _id: userId } = req.user;

    const result = await notificationService.markAsRead(id, userId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.message,
        message: 'Notification not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to mark notification as read'
    });
  }
});

/**
 * PUT /api/notifications/:id/dismiss
 * Dismiss a notification
 */
router.put('/:id/dismiss', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { _id: userId } = req.user;

    const notification = await Notification.findOne({
      _id: id,
      recipient_id: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
        message: 'Notification not found or access denied'
      });
    }

    await notification.dismiss();

    res.json({
      success: true,
      message: 'Notification dismissed'
    });

  } catch (error) {
    console.error('Dismiss notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to dismiss notification'
    });
  }
});

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read for the user
 */
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    const { _id: userId, organization_id } = req.user;

    const result = await Notification.updateMany(
      {
        recipient_id: userId,
        organization_id: organization_id,
        status: { $in: ['pending', 'sent'] },
        is_active: true
      },
      {
        status: 'read',
        'channels.in_app.read': true,
        'channels.in_app.read_at': new Date(),
        updated_at: new Date()
      }
    );

    res.json({
      success: true,
      data: {
        marked_count: result.modifiedCount
      },
      message: `Marked ${result.modifiedCount} notifications as read`
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to mark all notifications as read'
    });
  }
});

/**
 * POST /api/notifications/test-risk-alert
 * Test endpoint to create a sample risk alert (development only)
 */

router.post('/test-risk-alert', auth, async (req, res) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Not allowed in production',
        message: 'Test endpoints are not available in production'
      });
    }

    const { organization_id, role } = req.user;
    const { risk_level = 'high', student_name = 'Test Student', course_title = 'Test Course' } = req.body;

    // Only admins and instructors can test
    if (!['admin', 'instructor'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only admins and instructors can test notifications'
      });
    }

    // Create test risk assessment data
    const testRiskAssessment = {
      student_id: req.user._id, // Use current user as test student
      course_id: '507f1f77bcf86cd799439011', // Dummy course ID
      risk_score: risk_level === 'high' ? 85 : 55,
      risk_level: risk_level,
      factors: [
        {
          factor_type: 'attendance',
          score: risk_level === 'high' ? 80 : 50,
          details: { attendance_rate: risk_level === 'high' ? 20 : 50 }
        }
      ],
      suggestions: [
        'Contact student immediately',
        'Schedule one-on-one meeting',
        'Provide additional support materials'
      ]
    };

    const result = await notificationService.processRiskAssessment(
      testRiskAssessment,
      organization_id
    );

    res.json({
      success: true,
      data: result,
      message: 'Test risk alert processed'
    });

  } catch (error) {
    console.error('Test risk alert error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create test risk alert'
    });
  }
});

/**
 * GET /api/notifications/stats
 * Get notification statistics for the user
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const { _id: userId, organization_id } = req.user;

    const stats = await Notification.aggregate([
      {
        $match: {
          recipient_id: userId,
          organization_id: organization_id,
          is_active: true
        }
      },
      {
        $group: {
          _id: {
            status: '$status',
            type: '$type',
            priority: '$priority'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          by_status: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          by_type: {
            $push: {
              type: '$_id.type',
              count: '$count'
            }
          },
          by_priority: {
            $push: {
              priority: '$_id.priority',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      }
    ]);

    const result = stats[0] || {
      by_status: [],
      by_type: [],
      by_priority: [],
      total: 0
    };

    res.json({
      success: true,
      data: result,
      message: 'Notification statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve notification statistics'
    });
  }
});

module.exports = router;