const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./emailService');
const pushNotificationService = require('./pushNotificationService');
const logger = require('./logger');
const { 
  getNotificationConfig, 
  getDefaultChannels, 
  getDefaultPriority,
  validateNotificationData,
  shouldRespectQuietHours 
} = require('../config/notifications');

/**
 * Enhanced Notification Service
 * Handles multi-channel notification delivery with queue system
 */
class NotificationService {
  
  constructor() {
    this.riskThresholds = {
      high: 70,
      medium: 40
    };
  }

  /**
   * Send notification through multiple channels
   * @param {string} userId - User ID or array of user IDs
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {Array} channels - Channels to send through (optional)
   * @param {Object} options - Additional options
   */
  async sendNotification(userId, type, data, channels = null, options = {}) {
    try {
      // Validate input data
      const validationData = {
        organizationId: data.organizationId,
        type,
        userId,
        channels,
        priority: options.priority
      };
      
      const validation = validateNotificationData(validationData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Get notification configuration
      const config = getNotificationConfig(type);
      if (!config) {
        throw new Error(`Unknown notification type: ${type}`);
      }

      // Use default channels if not specified
      const targetChannels = channels || getDefaultChannels(type);
      const priority = options.priority || getDefaultPriority(type);

      // Handle multiple users
      const userIds = Array.isArray(userId) ? userId : [userId];
      const results = [];

      for (const uid of userIds) {
        try {
          const result = await this.sendSingleUserNotification(uid, type, data, targetChannels, priority, options);
          results.push(result);
        } catch (error) {
          logger.error(`Failed to send notification to user ${uid}:`, error);
          results.push({ success: false, userId: uid, error: error.message });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;

      logger.info('Multi-channel notification completed', {
        type,
        total: results.length,
        successful,
        failed,
        channels: targetChannels,
        priority
      });

      return {
        success: true,
        total: results.length,
        successful,
        failed,
        results
      };

    } catch (error) {
      logger.error('Send notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification to a single user
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {Array} channels - Channels to send through
   * @param {string} priority - Notification priority
   * @param {Object} options - Additional options
   */
  async sendSingleUserNotification(userId, type, data, channels, priority, options = {}) {
    try {
      // Get user details and preferences
      const user = await User.findById(userId).select('email profile preferences push_tokens organization_id');
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Check user preferences
      const userChannels = this.filterChannelsByPreferences(channels, user.preferences, type);
      if (userChannels.length === 0) {
        return { success: true, userId, message: 'No channels enabled for user', skipped: true };
      }

      // Check quiet hours
      if (shouldRespectQuietHours(priority) && this.isQuietHours(user.preferences)) {
        // Delay notification until after quiet hours
        const delay = this.calculateQuietHoursDelay(user.preferences);
        options.delay = delay;
      }

      // Create notification record
      const notification = await this.createNotificationRecord(userId, type, data, userChannels, priority);

      // Queue notifications for each channel
      const channelResults = [];
      
      for (const channel of userChannels) {
        try {
          const result = await this.queueChannelNotification(channel, user, notification, type, data, options);
          channelResults.push({ channel, success: true, jobId: result.jobId });
        } catch (error) {
          logger.error(`Failed to queue ${channel} notification:`, error);
          channelResults.push({ channel, success: false, error: error.message });
        }
      }

      return {
        success: true,
        userId,
        notificationId: notification._id,
        channels: channelResults
      };

    } catch (error) {
      logger.error(`Failed to send notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create notification record in database
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {Array} channels - Channels
   * @param {string} priority - Priority
   */
  async createNotificationRecord(userId, type, data, channels, priority) {
    try {
      const config = getNotificationConfig(type);
      
      const notification = await Notification.create({
        organization_id: data.organizationId,
        user_id: userId,
        type,
        title: data.title || config.name,
        message: data.message || `You have a new ${config.name.toLowerCase()}`,
        data: data.templateData || {},
        channels: channels.map(channel => ({
          type: channel,
          status: 'pending',
          enabled: true
        })),
        priority,
        read: false,
        createdAt: new Date()
      });

      return notification;
    } catch (error) {
      logger.error('Failed to create notification record:', error);
      throw error;
    }
  }

  /**
   * Queue notification for specific channel
   * @param {string} channel - Channel type
   * @param {Object} user - User object
   * @param {Object} notification - Notification record
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {Object} options - Options
   */
  async queueChannelNotification(channel, user, notification, type, data, options = {}) {
    const jobData = {
      notificationId: notification._id,
      userId: user._id,
      organizationId: user.organization_id,
      type,
      ...data
    };

    const jobOptions = {
      priority: options.priority,
      delay: options.delay || 0,
      attempts: options.attempts
    };

    switch (channel) {
      case 'email':
        return await this.queueEmailNotification(user, jobData, jobOptions);
      
      case 'push':
        return await this.queuePushNotification(user, jobData, jobOptions);
      
      case 'in_app':
        return await this.queueInAppNotification(user, jobData, jobOptions);
      
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  /**
   * Send email notification directly (no queue)
   */
  async queueEmailNotification(user, data, options) {
    const config = getNotificationConfig(data.type);
    const emailData = {
      to: user.email,
      templateName: config.template,
      data: {
        ...data.templateData,
        studentName: user.profile?.firstName + ' ' + user.profile?.lastName,
        organizationName: data.organizationName || 'Smart LMS'
      },
      notificationId: data.notificationId
    };

    // Send directly without queue
    try {
      const result = await emailService.sendTemplatedEmail(emailData);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Failed to send email notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification directly (no queue)
   */
  async queuePushNotification(user, data, options) {
    if (!user.push_tokens || user.push_tokens.length === 0) {
      throw new Error('No push tokens available for user');
    }

    const notification = pushNotificationService.createNotificationPayload(data.type, data.templateData);
    
    // Send directly without queue
    try {
      const result = await pushNotificationService.sendBulkPushNotifications(user.push_tokens, notification);
      return { success: true, result };
    } catch (error) {
      logger.error('Failed to send push notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create in-app notification directly (no queue)
   */
  async queueInAppNotification(user, data, options) {
    const config = getNotificationConfig(data.type);
    const inAppData = {
      organization_id: user.organization_id,
      user_id: user._id,
      type: data.type,
      title: data.title || config.name,
      message: data.message || `You have a new ${config.name.toLowerCase()}`,
      data: data.templateData || {},
      channels: [{
        type: 'in_app',
        status: 'sent',
        sentAt: new Date()
      }],
      priority: options.priority || 'normal',
      read: false,
      createdAt: new Date()
    };

    // Create directly without queue
    try {
      const notification = await Notification.create(inAppData);
      return { success: true, notificationId: notification._id };
    } catch (error) {
      logger.error('Failed to create in-app notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Filter channels based on user preferences
   * @param {Array} channels - Requested channels
   * @param {Object} preferences - User preferences
   * @param {string} type - Notification type
   */
  filterChannelsByPreferences(channels, preferences, type) {
    if (!preferences || !preferences.notifications) {
      return channels; // Use all channels if no preferences set
    }

    const userPrefs = preferences.notifications;
    const filtered = [];

    for (const channel of channels) {
      // Check global channel preference
      if (userPrefs[channel] === false) {
        continue;
      }

      // Check category-specific preference
      if (userPrefs.categories && userPrefs.categories[type] === false) {
        continue;
      }

      filtered.push(channel);
    }

    return filtered;
  }

  /**
   * Check if current time is within user's quiet hours
   * @param {Object} preferences - User preferences
   */
  isQuietHours(preferences) {
    if (!preferences || !preferences.notifications || !preferences.notifications.quietHours) {
      return false;
    }

    const quietHours = preferences.notifications.quietHours;
    if (!quietHours.enabled) {
      return false;
    }

    // This is a simplified implementation
    // In production, you'd want to handle timezones properly
    const now = new Date();
    const currentHour = now.getHours();
    const startHour = parseInt(quietHours.start.split(':')[0]);
    const endHour = parseInt(quietHours.end.split(':')[0]);

    if (startHour <= endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  /**
   * Calculate delay until after quiet hours
   * @param {Object} preferences - User preferences
   */
  calculateQuietHoursDelay(preferences) {
    // Simplified implementation - delay by 1 hour
    return 60 * 60 * 1000; // 1 hour in milliseconds
  }

  /**
   * Send enrollment notification
   * @param {Object} enrollmentData - Enrollment data
   */
  async sendEnrollmentNotification(enrollmentData) {
    try {
      const { studentId, courseId, instructorId, organizationId } = enrollmentData;

      // Get course and student details
      const [course, student] = await Promise.all([
        require('../models/Course').findById(courseId).select('title'),
        User.findById(studentId).select('profile email')
      ]);

      if (!course || !student) {
        throw new Error('Course or student not found');
      }

      const notificationData = {
        organizationId,
        title: 'New Student Enrollment',
        message: `${student.profile.firstName} ${student.profile.lastName} enrolled in ${course.title}`,
        templateData: {
          studentName: `${student.profile.firstName} ${student.profile.lastName}`,
          courseName: course.title,
          enrollmentDate: new Date().toLocaleDateString(),
          organizationName: enrollmentData.organizationName
        }
      };

      // Send to instructor
      return await this.sendNotification(instructorId, 'enrollment', notificationData);

    } catch (error) {
      logger.error('Send enrollment notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send payment success notification
   * @param {Object} paymentData - Payment data
   */
  async sendPaymentSuccessNotification(paymentData) {
    try {
      const { studentId, courseId, amount, currency, paymentId, organizationId } = paymentData;

      // Get course and student details
      const [course, student] = await Promise.all([
        require('../models/Course').findById(courseId).select('title'),
        User.findById(studentId).select('profile email')
      ]);

      if (!course || !student) {
        throw new Error('Course or student not found');
      }

      const notificationData = {
        organizationId,
        title: 'Payment Successful',
        message: `Payment of ${amount} ${currency} successful for ${course.title}`,
        templateData: {
          studentName: `${student.profile.firstName} ${student.profile.lastName}`,
          courseName: course.title,
          amount,
          currency,
          paymentId,
          paymentDate: new Date().toLocaleDateString(),
          organizationName: paymentData.organizationName
        }
      };

      // Send to student and admin
      const recipients = [studentId];
      if (paymentData.adminId) {
        recipients.push(paymentData.adminId);
      }

      return await this.sendNotification(recipients, 'payment_success', notificationData);

    } catch (error) {
      logger.error('Send payment success notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send quiz passed notification
   * @param {Object} quizData - Quiz data
   */
  async sendQuizPassedNotification(quizData) {
    try {
      const { studentId, quizId, courseId, score, organizationId } = quizData;

      // Get quiz, course and student details
      const [quiz, course, student] = await Promise.all([
        require('../models/Quiz').findById(quizId).select('title'),
        require('../models/Course').findById(courseId).select('title'),
        User.findById(studentId).select('profile email')
      ]);

      if (!quiz || !course || !student) {
        throw new Error('Quiz, course or student not found');
      }

      const notificationData = {
        organizationId,
        title: 'Quiz Passed!',
        message: `Congratulations! You passed ${quiz.title} with ${score}%`,
        templateData: {
          studentName: `${student.profile.firstName} ${student.profile.lastName}`,
          quizName: quiz.title,
          courseName: course.title,
          score,
          completionDate: new Date().toLocaleDateString(),
          organizationName: quizData.organizationName
        }
      };

      // Send to student
      return await this.sendNotification(studentId, 'quiz_passed', notificationData);

    } catch (error) {
      logger.error('Send quiz passed notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send fee overdue notification
   * @param {Object} feeData - Fee data
   */
  async sendFeeOverdueNotification(feeData) {
    try {
      const { studentId, courseId, amount, currency, dueDate, organizationId } = feeData;

      // Get course and student details
      const [course, student] = await Promise.all([
        require('../models/Course').findById(courseId).select('title'),
        User.findById(studentId).select('profile email')
      ]);

      if (!course || !student) {
        throw new Error('Course or student not found');
      }

      const notificationData = {
        organizationId,
        title: 'Fee Payment Overdue',
        message: `Your fee of ${amount} ${currency} is overdue. Please pay to continue access.`,
        templateData: {
          studentName: `${student.profile.firstName} ${student.profile.lastName}`,
          courseName: course.title,
          amount,
          currency,
          dueDate: new Date(dueDate).toLocaleDateString(),
          daysOverdue: Math.floor((Date.now() - new Date(dueDate)) / (1000 * 60 * 60 * 24)),
          organizationName: feeData.organizationName
        }
      };

      // Send to student with high priority
      return await this.sendNotification(studentId, 'fee_overdue', notificationData, null, { priority: 'high' });

    } catch (error) {
      logger.error('Send fee overdue notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send high-risk alert notifications
   * @param {Object} riskAssessment - Risk assessment data
   * @param {string} organizationId - Organization ID
   */
  async sendHighRiskAlert(riskAssessment, organizationId) {
    try {
      const { student_id, course_id, risk_score, risk_level, suggestions, factors } = riskAssessment;

      // Only send for high-risk students
      if (risk_level !== 'high') {
        return { success: false, message: 'Not a high-risk student' };
      }

      // Get student and course details
      const [student, course] = await Promise.all([
        User.findById(student_id).select('profile email'),
        require('../models/Course').findById(course_id).select('title instructor_id')
      ]);

      if (!student || !course) {
        return { success: false, message: 'Student or course not found' };
      }

      // Find instructors and admins to notify
      const recipients = await User.find({
        organization_id: organizationId,
        $or: [
          { role: 'admin' },
          { role: 'instructor', _id: course.instructor_id }
        ],
        is_active: true
      }).select('_id');

      const recipientIds = recipients.map(r => r._id);

      const notificationData = {
        organizationId,
        title: 'High Risk Student Alert',
        message: `${student.profile.firstName} ${student.profile.lastName} has high dropout risk (${risk_score}%). Immediate attention needed.`,
        templateData: {
          studentName: `${student.profile.firstName} ${student.profile.lastName}`,
          courseName: course.title,
          riskScore: risk_score,
          riskFactors: factors,
          suggestions,
          enrollmentDate: new Date().toLocaleDateString(),
          lastActivity: 'Recently',
          courseProgress: '45%', // This would come from actual progress data
          organizationName: riskAssessment.organizationName
        }
      };

      // Send high priority alert to instructors and admins
      return await this.sendNotification(recipientIds, 'high_risk_alert', notificationData, null, { priority: 'critical' });

    } catch (error) {
      logger.error('Send high-risk alert error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send medium-risk alert notifications
   * @param {Object} riskAssessment - Risk assessment data
   * @param {string} organizationId - Organization ID
   */
  async sendMediumRiskAlert(riskAssessment, organizationId) {
    try {
      const { student_id, course_id, risk_score, risk_level, suggestions } = riskAssessment;

      // Only send for medium-risk students
      if (risk_level !== 'medium') {
        return { success: false, message: 'Not a medium-risk student' };
      }

      // Get student and course details
      const [student, course] = await Promise.all([
        User.findById(student_id).select('profile email'),
        require('../models/Course').findById(course_id).select('title instructor_id')
      ]);

      if (!student || !course) {
        return { success: false, message: 'Student or course not found' };
      }

      // Find instructors to notify (not admins for medium risk)
      const recipients = await User.find({
        organization_id: organizationId,
        role: 'instructor',
        _id: course.instructor_id,
        is_active: true
      }).select('_id');

      const recipientIds = recipients.map(r => r._id);

      const notificationData = {
        organizationId,
        title: 'Medium Risk Student Alert',
        message: `${student.profile.firstName} ${student.profile.lastName} has medium dropout risk (${risk_score}%). Monitor closely.`,
        templateData: {
          studentName: `${student.profile.firstName} ${student.profile.lastName}`,
          courseName: course.title,
          riskScore: risk_score,
          suggestions,
          organizationName: riskAssessment.organizationName
        }
      };

      // Send normal priority alert to instructors only
      return await this.sendNotification(recipientIds, 'medium_risk_alert', notificationData, ['in_app'], { priority: 'normal' });

    } catch (error) {
      logger.error('Send medium-risk alert error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process risk assessment and trigger notifications if needed
   * @param {Object} riskAssessment - Risk assessment data
   * @param {string} organizationId - Organization ID
   */
  async processRiskAssessment(riskAssessment, organizationId) {
    try {
      const { risk_level, risk_score } = riskAssessment;
      
      let result = { success: true, notifications_sent: 0 };

      // Check if we should send high-risk alert
      if (risk_level === 'high' && risk_score >= this.riskThresholds.high) {
        const highRiskResult = await this.sendHighRiskAlert(riskAssessment, organizationId);
        if (highRiskResult.success) {
          result.notifications_sent += highRiskResult.successful || 0;
          result.high_risk_alert = true;
        }
      }
      
      // Check if we should send medium-risk alert
      else if (risk_level === 'medium' && risk_score >= this.riskThresholds.medium) {
        const mediumRiskResult = await this.sendMediumRiskAlert(riskAssessment, organizationId);
        if (mediumRiskResult.success) {
          result.notifications_sent += mediumRiskResult.successful || 0;
          result.medium_risk_alert = true;
        }
      }

      return result;

    } catch (error) {
      logger.error('Process risk assessment error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID
   * @param {Object} filters - Additional filters
   */
  async getUserNotifications(userId, organizationId, filters = {}) {
    try {
      const query = {
        user_id: userId,
        organization_id: organizationId,
        ...filters
      };

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50);

      return { success: true, notifications };
    } catch (error) {
      logger.error('Get user notifications error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for security)
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        user_id: userId
      });

      if (!notification) {
        return { success: false, message: 'Notification not found' };
      }

      notification.read = true;
      notification.readAt = new Date();
      await notification.save();

      return { success: true, message: 'Notification marked as read' };
    } catch (error) {
      logger.error('Mark notification as read error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get notification statistics
   * @param {string} organizationId - Organization ID
   */
  async getNotificationStats(organizationId) {
    try {
      const stats = await Notification.aggregate([
        { $match: { organization_id: organizationId } },
        {
          $group: {
            _id: '$type',
            total: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] } }
          }
        }
      ]);

      return { success: true, stats };
    } catch (error) {
      logger.error('Get notification stats error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;