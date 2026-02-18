const { Expo } = require('expo-server-sdk');
const logger = require('./logger');

/**
 * Push Notification Service using Expo SDK
 * Handles mobile push notifications with device token management
 */
class PushNotificationService {
  constructor() {
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
      useFcmV1: true
    });
    this.maxBatchSize = 100; // Expo's recommended batch size
  }

  /**
   * Send push notification to single device
   * @param {string} pushToken - Device push token
   * @param {Object} notification - Notification data
   * @param {string} notification.title - Notification title
   * @param {string} notification.body - Notification body
   * @param {Object} notification.data - Additional data
   * @param {string} notification.priority - Priority (default, normal, high)
   * @param {number} notification.ttl - Time to live in seconds
   */
  async sendPushNotification(pushToken, notification) {
    try {
      // Validate push token
      if (!Expo.isExpoPushToken(pushToken)) {
        throw new Error(`Invalid Expo push token: ${pushToken}`);
      }

      const { title, body, data = {}, priority = 'default', ttl = 3600 } = notification;

      const message = {
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        priority: priority,
        ttl: ttl,
        channelId: 'default'
      };

      // Send notification
      const tickets = await this.expo.sendPushNotificationsAsync([message]);
      const ticket = tickets[0];

      if (ticket.status === 'error') {
        logger.error('Push notification error:', {
          error: ticket.message,
          details: ticket.details,
          pushToken: pushToken
        });
        throw new Error(ticket.message);
      }

      logger.info('Push notification sent successfully', {
        pushToken: pushToken,
        ticketId: ticket.id,
        title: title
      });

      return {
        success: true,
        ticketId: ticket.id,
        pushToken: pushToken
      };

    } catch (error) {
      logger.error('Failed to send push notification:', {
        error: error.message,
        pushToken: pushToken,
        notification: notification
      });
      throw error;
    }
  }

  /**
   * Send push notifications to multiple devices
   * @param {Array} pushTokens - Array of device push tokens
   * @param {Object} notification - Notification data
   */
  async sendBulkPushNotifications(pushTokens, notification) {
    try {
      // Filter valid push tokens
      const validTokens = pushTokens.filter(token => Expo.isExpoPushToken(token));
      
      if (validTokens.length === 0) {
        throw new Error('No valid push tokens provided');
      }

      const { title, body, data = {}, priority = 'default', ttl = 3600 } = notification;

      // Create messages for all valid tokens
      const messages = validTokens.map(pushToken => ({
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        priority: priority,
        ttl: ttl,
        channelId: 'default'
      }));

      // Split into chunks for batch processing
      const chunks = this.chunkArray(messages, this.maxBatchSize);
      const allTickets = [];

      for (const chunk of chunks) {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        allTickets.push(...tickets);
        
        // Small delay between batches to avoid rate limiting
        if (chunks.length > 1) {
          await this.delay(100);
        }
      }

      // Process results
      const results = {
        total: validTokens.length,
        successful: 0,
        failed: 0,
        tickets: [],
        errors: []
      };

      allTickets.forEach((ticket, index) => {
        if (ticket.status === 'ok') {
          results.successful++;
          results.tickets.push({
            pushToken: validTokens[index],
            ticketId: ticket.id,
            status: 'sent'
          });
        } else {
          results.failed++;
          results.errors.push({
            pushToken: validTokens[index],
            error: ticket.message,
            details: ticket.details
          });
          
          logger.warn('Push notification failed for token:', {
            pushToken: validTokens[index],
            error: ticket.message,
            details: ticket.details
          });
        }
      });

      logger.info('Bulk push notifications completed', {
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        title: title
      });

      return results;

    } catch (error) {
      logger.error('Failed to send bulk push notifications:', {
        error: error.message,
        tokenCount: pushTokens.length,
        notification: notification
      });
      throw error;
    }
  }

  /**
   * Check delivery receipts for sent notifications
   * @param {Array} ticketIds - Array of ticket IDs from sent notifications
   */
  async checkDeliveryReceipts(ticketIds) {
    try {
      if (!ticketIds || ticketIds.length === 0) {
        return { receipts: [], errors: [] };
      }

      // Split into chunks for batch processing
      const chunks = this.chunkArray(ticketIds, this.maxBatchSize);
      const allReceipts = {};

      for (const chunk of chunks) {
        const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
        Object.assign(allReceipts, receipts);
        
        // Small delay between batches
        if (chunks.length > 1) {
          await this.delay(100);
        }
      }

      // Process receipts
      const results = {
        receipts: [],
        errors: []
      };

      Object.entries(allReceipts).forEach(([ticketId, receipt]) => {
        if (receipt.status === 'ok') {
          results.receipts.push({
            ticketId: ticketId,
            status: 'delivered'
          });
        } else {
          results.errors.push({
            ticketId: ticketId,
            status: receipt.status,
            message: receipt.message,
            details: receipt.details
          });
          
          logger.warn('Push notification delivery failed:', {
            ticketId: ticketId,
            status: receipt.status,
            message: receipt.message,
            details: receipt.details
          });
        }
      });

      logger.info('Delivery receipts checked', {
        total: ticketIds.length,
        delivered: results.receipts.length,
        failed: results.errors.length
      });

      return results;

    } catch (error) {
      logger.error('Failed to check delivery receipts:', {
        error: error.message,
        ticketCount: ticketIds.length
      });
      throw error;
    }
  }

  /**
   * Validate push token format
   * @param {string} pushToken - Push token to validate
   * @returns {boolean} True if valid
   */
  isValidPushToken(pushToken) {
    return Expo.isExpoPushToken(pushToken);
  }

  /**
   * Clean invalid push tokens from array
   * @param {Array} pushTokens - Array of push tokens
   * @returns {Object} Object with valid and invalid tokens
   */
  validatePushTokens(pushTokens) {
    const valid = [];
    const invalid = [];

    pushTokens.forEach(token => {
      if (this.isValidPushToken(token)) {
        valid.push(token);
      } else {
        invalid.push(token);
      }
    });

    return { valid, invalid };
  }

  /**
   * Create notification payload for different types
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @returns {Object} Formatted notification payload
   */
  createNotificationPayload(type, data) {
    const payloads = {
      enrollment: {
        title: '🎓 New Enrollment',
        body: `${data.studentName} enrolled in ${data.courseName}`,
        data: {
          type: 'enrollment',
          courseId: data.courseId,
          studentId: data.studentId
        }
      },
      payment_success: {
        title: '💳 Payment Successful',
        body: `Payment of ${data.amount} ${data.currency} received for ${data.courseName}`,
        data: {
          type: 'payment',
          paymentId: data.paymentId,
          courseId: data.courseId,
          amount: data.amount
        }
      },
      quiz_passed: {
        title: '🎉 Quiz Passed!',
        body: `Congratulations! You passed ${data.quizName} with ${data.score}%`,
        data: {
          type: 'quiz_result',
          quizId: data.quizId,
          score: data.score,
          courseId: data.courseId
        }
      },
      fee_overdue: {
        title: '⚠️ Fee Overdue',
        body: `Your fee of ${data.amount} ${data.currency} is overdue. Please pay to continue access.`,
        data: {
          type: 'fee_reminder',
          feeId: data.feeId,
          amount: data.amount,
          dueDate: data.dueDate
        },
        priority: 'high'
      },
      high_risk_alert: {
        title: '🚨 Student Risk Alert',
        body: `${data.studentName} has high dropout risk (${data.riskScore}%). Immediate attention needed.`,
        data: {
          type: 'risk_alert',
          studentId: data.studentId,
          courseId: data.courseId,
          riskScore: data.riskScore,
          riskLevel: 'high'
        },
        priority: 'high'
      },
      live_class_starting: {
        title: '📹 Live Class Starting Soon',
        body: `${data.className} starts in 15 minutes. Join now!`,
        data: {
          type: 'live_class',
          classId: data.classId,
          courseId: data.courseId,
          startTime: data.startTime
        },
        priority: 'high'
      },
      course_update: {
        title: '📚 Course Updated',
        body: `New content added to ${data.courseName}. Check it out!`,
        data: {
          type: 'course_update',
          courseId: data.courseId,
          updateType: data.updateType
        }
      }
    };

    return payloads[type] || {
      title: 'Smart LMS Notification',
      body: data.message || 'You have a new notification',
      data: { type: 'general', ...data }
    };
  }

  /**
   * Utility function to create delay
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Utility function to chunk array into smaller arrays
   * @param {Array} array - Array to chunk
   * @param {number} size - Chunk size
   * @returns {Array} Array of chunks
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      maxBatchSize: this.maxBatchSize,
      expoReady: !!this.expo
    };
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

module.exports = pushNotificationService;