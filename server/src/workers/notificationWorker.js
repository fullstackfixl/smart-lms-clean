const notificationQueue = require('../utils/notificationQueue');
const emailService = require('../utils/emailService');
const pushNotificationService = require('../utils/pushNotificationService');
const logger = require('../utils/logger');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Notification Worker
 * Processes notification jobs from Redis queues
 */
class NotificationWorker {
  constructor() {
    this.isRunning = false;
    this.processors = {};
  }

  /**
   * Start all notification workers
   */
  start() {
    if (this.isRunning) {
      logger.warn('Notification worker is already running');
      return;
    }

    try {
      // Check if notification queue is initialized
      if (!notificationQueue.isInitialized) {
        logger.warn('Notification queue not initialized, worker will not start');
        return;
      }

      this.setupProcessors();
      this.isRunning = true;
      logger.info('Notification worker started successfully');
    } catch (error) {
      logger.error('Failed to start notification worker:', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Set up job processors for each queue
   */
  setupProcessors() {
    // Check if queues are available
    if (!notificationQueue.queues || Object.keys(notificationQueue.queues).length === 0) {
      logger.warn('No queues available for processing');
      return;
    }

    // Email notification processor
    if (notificationQueue.queues.email) {
      this.processors.email = notificationQueue.queues.email.process('send-email', 5, async (job) => {
        return await this.processEmailJob(job);
      });
    }

    // Push notification processor
    if (notificationQueue.queues.push) {
      this.processors.push = notificationQueue.queues.push.process('send-push', 10, async (job) => {
        return await this.processPushJob(job);
      });
    }

    // In-app notification processor
    if (notificationQueue.queues.inapp) {
      this.processors.inapp = notificationQueue.queues.inapp.process('create-notification', 20, async (job) => {
        return await this.processInAppJob(job);
      });
    }

    // Mobile sync processor
    if (notificationQueue.queues.sync) {
      this.processors.sync = notificationQueue.queues.sync.process('sync-data', 3, async (job) => {
        return await this.processSyncJob(job);
      });
    }

    logger.info('Notification job processors set up successfully', {
      processors: Object.keys(this.processors).length
    });
  }

  /**
   * Process email notification job
   * @param {Object} job - Bull job object
   */
  async processEmailJob(job) {
    const startTime = Date.now();
    const { to, templateName, data, subject, retries } = job.data;

    try {
      logger.info('Processing email job', {
        jobId: job.id,
        recipient: to,
        template: templateName,
        attempt: job.attemptsMade + 1
      });

      let result;
      
      if (templateName) {
        // Send templated email
        result = await emailService.sendTemplatedEmail({
          to,
          templateName,
          data,
          subject,
          retries: retries || 1 // Don't retry in service if job will retry
        });
      } else {
        // Send plain email
        result = await emailService.sendPlainEmail({
          to,
          subject: subject || 'Notification from Smart LMS',
          text: data.text,
          html: data.html,
          retries: retries || 1
        });
      }

      const processingTime = Date.now() - startTime;
      
      logger.info('Email job completed successfully', {
        jobId: job.id,
        recipient: to,
        messageId: result.messageId,
        processingTime: `${processingTime}ms`
      });

      // Update notification status if notificationId is provided
      if (job.data.notificationId) {
        await this.updateNotificationStatus(job.data.notificationId, 'email', 'sent', {
          messageId: result.messageId,
          sentAt: new Date()
        });
      }

      return {
        success: true,
        messageId: result.messageId,
        processingTime,
        attempt: result.attempt
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('Email job failed', {
        jobId: job.id,
        recipient: to,
        error: error.message,
        processingTime: `${processingTime}ms`,
        attempt: job.attemptsMade + 1
      });

      // Update notification status if notificationId is provided
      if (job.data.notificationId) {
        await this.updateNotificationStatus(job.data.notificationId, 'email', 'failed', {
          error: error.message,
          failedAt: new Date()
        });
      }

      throw error; // Re-throw to trigger job retry
    }
  }

  /**
   * Process push notification job
   * @param {Object} job - Bull job object
   */
  async processPushJob(job) {
    const startTime = Date.now();
    const { pushTokens, notification, notificationId } = job.data;

    try {
      logger.info('Processing push notification job', {
        jobId: job.id,
        tokenCount: Array.isArray(pushTokens) ? pushTokens.length : 1,
        title: notification.title,
        attempt: job.attemptsMade + 1
      });

      let result;

      if (Array.isArray(pushTokens)) {
        // Send bulk push notifications
        result = await pushNotificationService.sendBulkPushNotifications(pushTokens, notification);
      } else {
        // Send single push notification
        result = await pushNotificationService.sendPushNotification(pushTokens, notification);
        // Normalize result format
        result = {
          total: 1,
          successful: result.success ? 1 : 0,
          failed: result.success ? 0 : 1,
          tickets: result.success ? [{ pushToken: pushTokens, ticketId: result.ticketId }] : [],
          errors: result.success ? [] : [{ pushToken: pushTokens, error: 'Send failed' }]
        };
      }

      const processingTime = Date.now() - startTime;

      logger.info('Push notification job completed', {
        jobId: job.id,
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        processingTime: `${processingTime}ms`
      });

      // Update notification status if notificationId is provided
      if (notificationId) {
        const status = result.successful > 0 ? 'sent' : 'failed';
        await this.updateNotificationStatus(notificationId, 'push', status, {
          tickets: result.tickets,
          errors: result.errors,
          sentAt: new Date()
        });
      }

      return {
        success: true,
        ...result,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error('Push notification job failed', {
        jobId: job.id,
        error: error.message,
        processingTime: `${processingTime}ms`,
        attempt: job.attemptsMade + 1
      });

      // Update notification status if notificationId is provided
      if (notificationId) {
        await this.updateNotificationStatus(notificationId, 'push', 'failed', {
          error: error.message,
          failedAt: new Date()
        });
      }

      throw error; // Re-throw to trigger job retry
    }
  }

  /**
   * Process in-app notification job
   * @param {Object} job - Bull job object
   */
  async processInAppJob(job) {
    const startTime = Date.now();
    const { userId, organizationId, type, title, message, data, priority } = job.data;

    try {
      logger.info('Processing in-app notification job', {
        jobId: job.id,
        userId,
        type,
        attempt: job.attemptsMade + 1
      });

      // Create in-app notification in database
      const notification = await Notification.create({
        organization_id: organizationId,
        user_id: userId,
        type,
        title,
        message,
        data: data || {},
        channels: [{
          type: 'in_app',
          status: 'sent',
          sentAt: new Date()
        }],
        priority: priority || 'normal',
        read: false,
        createdAt: new Date()
      });

      const processingTime = Date.now() - startTime;

      logger.info('In-app notification job completed', {
        jobId: job.id,
        notificationId: notification._id,
        userId,
        processingTime: `${processingTime}ms`
      });

      return {
        success: true,
        notificationId: notification._id,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error('In-app notification job failed', {
        jobId: job.id,
        userId,
        error: error.message,
        processingTime: `${processingTime}ms`,
        attempt: job.attemptsMade + 1
      });

      throw error; // Re-throw to trigger job retry
    }
  }

  /**
   * Process mobile sync job
   * @param {Object} job - Bull job object
   */
  async processSyncJob(job) {
    const startTime = Date.now();
    const { userId, organizationId, syncType, data } = job.data;

    try {
      logger.info('Processing mobile sync job', {
        jobId: job.id,
        userId,
        syncType,
        attempt: job.attemptsMade + 1
      });

      // This is a placeholder for mobile sync logic
      // In a real implementation, this would handle:
      // - User data synchronization
      // - Course content sync
      // - Progress updates
      // - Conflict resolution
      
      let result = { success: true, syncedItems: 0 };

      switch (syncType) {
        case 'user_data':
          result = await this.syncUserData(userId, organizationId, data);
          break;
        case 'course_progress':
          result = await this.syncCourseProgress(userId, organizationId, data);
          break;
        case 'notifications':
          result = await this.syncNotifications(userId, organizationId, data);
          break;
        default:
          throw new Error(`Unknown sync type: ${syncType}`);
      }

      const processingTime = Date.now() - startTime;

      logger.info('Mobile sync job completed', {
        jobId: job.id,
        userId,
        syncType,
        syncedItems: result.syncedItems,
        processingTime: `${processingTime}ms`
      });

      return {
        success: true,
        ...result,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error('Mobile sync job failed', {
        jobId: job.id,
        userId,
        syncType,
        error: error.message,
        processingTime: `${processingTime}ms`,
        attempt: job.attemptsMade + 1
      });

      throw error; // Re-throw to trigger job retry
    }
  }

  /**
   * Update notification status in database
   * @param {string} notificationId - Notification ID
   * @param {string} channel - Channel type (email, push, in_app)
   * @param {string} status - Status (sent, failed, delivered)
   * @param {Object} metadata - Additional metadata
   */
  async updateNotificationStatus(notificationId, channel, status, metadata = {}) {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        logger.warn('Notification not found for status update', { notificationId, channel, status });
        return;
      }

      // Find the channel in the notification
      const channelIndex = notification.channels.findIndex(c => c.type === channel);
      if (channelIndex === -1) {
        logger.warn('Channel not found in notification', { notificationId, channel });
        return;
      }

      // Update channel status
      notification.channels[channelIndex].status = status;
      Object.assign(notification.channels[channelIndex], metadata);

      await notification.save();

      logger.debug('Notification status updated', {
        notificationId,
        channel,
        status,
        metadata
      });

    } catch (error) {
      logger.error('Failed to update notification status:', {
        error: error.message,
        notificationId,
        channel,
        status
      });
    }
  }

  /**
   * Sync user data (placeholder implementation)
   */
  async syncUserData(userId, organizationId, data) {
    // Placeholder implementation
    return { success: true, syncedItems: 1 };
  }

  /**
   * Sync course progress (placeholder implementation)
   */
  async syncCourseProgress(userId, organizationId, data) {
    // Placeholder implementation
    return { success: true, syncedItems: data.progressItems?.length || 0 };
  }

  /**
   * Sync notifications (placeholder implementation)
   */
  async syncNotifications(userId, organizationId, data) {
    // Placeholder implementation
    return { success: true, syncedItems: data.notifications?.length || 0 };
  }

  /**
   * Stop all notification workers
   */
  async stop() {
    if (!this.isRunning) {
      logger.warn('Notification worker is not running');
      return;
    }

    try {
      // Close all processors
      await Promise.all(
        Object.values(this.processors).map(processor => {
          if (processor && typeof processor.close === 'function') {
            return processor.close();
          }
        })
      );

      this.isRunning = false;
      logger.info('Notification worker stopped successfully');
    } catch (error) {
      logger.error('Error stopping notification worker:', error);
      throw error;
    }
  }

  /**
   * Get worker statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      processors: Object.keys(this.processors).length
    };
  }
}

// Create singleton instance
const notificationWorker = new NotificationWorker();

module.exports = notificationWorker;