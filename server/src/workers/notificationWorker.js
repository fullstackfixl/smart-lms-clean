const logger = require('../utils/logger');

/**
 * Notification Worker (Simplified - No Redis)
 * Notifications are disabled, this is a stub to prevent errors
 */
class NotificationWorker {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start notification worker (no-op when disabled)
   */
  start() {
    if (process.env.ENABLE_NOTIFICATIONS !== 'true') {
      logger.info('Notifications disabled, worker will not start');
      return;
    }
    
    logger.warn('Notifications enabled but Redis/Bull removed - notifications will not work');
    this.isRunning = false;
  }

  /**
   * Stop notification worker (no-op)
   */
  async stop() {
    this.isRunning = false;
    logger.info('Notification worker stopped');
  }

  /**
   * Get worker statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      enabled: process.env.ENABLE_NOTIFICATIONS === 'true'
    };
  }
}

// Create singleton instance
const notificationWorker = new NotificationWorker();

module.exports = notificationWorker;