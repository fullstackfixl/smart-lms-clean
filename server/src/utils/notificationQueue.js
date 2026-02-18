const Queue = require('bull');
const Redis = require('ioredis');
const logger = require('./logger');

/**
 * Notification Queue System using Bull and Redis
 * Handles reliable job processing with retry logic and monitoring
 */
class NotificationQueue {
  constructor() {
    this.redis = null;
    this.queues = {};
    this.isInitialized = false;
    this.initialize();
  }

  /**
   * Initialize Redis connection and queues
   */
  initialize() {
    try {
      // Check if Redis is enabled
      if (process.env.ENABLE_NOTIFICATIONS !== 'true') {
        logger.warn('Notifications disabled, skipping queue initialization');
        this.isInitialized = false;
        return;
      }

      // Create Redis connection
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true
      };

      // Use Redis URL if provided
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          ...redisConfig,
          lazyConnect: true
        });
      } else {
        this.redis = new Redis(redisConfig);
      }

      // Test Redis connection
      this.redis.ping().then(() => {
        logger.info('Redis connection successful');
        this.createQueues(redisConfig);
      }).catch((error) => {
        logger.warn('Redis connection failed, notifications will be disabled:', error.message);
        this.redis = null;
        this.isInitialized = false;
        return;
      });

    } catch (error) {
      logger.error('Failed to initialize notification queue system:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Create notification queues
   */
  createQueues(redisConfig) {
    try {
      // Create notification queues
      this.queues = {
        email: new Queue('email notifications', {
          redis: redisConfig.host ? redisConfig : process.env.REDIS_URL,
          defaultJobOptions: {
            removeOnComplete: 50, // Keep last 50 completed jobs
            removeOnFail: 100,    // Keep last 100 failed jobs
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000
            }
          }
        }),

        push: new Queue('push notifications', {
          redis: redisConfig.host ? redisConfig : process.env.REDIS_URL,
          defaultJobOptions: {
            removeOnComplete: 50,
            removeOnFail: 100,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000
            }
          }
        }),

        inapp: new Queue('in-app notifications', {
          redis: redisConfig.host ? redisConfig : process.env.REDIS_URL,
          defaultJobOptions: {
            removeOnComplete: 100,
            removeOnFail: 50,
            attempts: 2,
            backoff: {
              type: 'fixed',
              delay: 1000
            }
          }
        }),

        sync: new Queue('mobile sync', {
          redis: redisConfig.host ? redisConfig : process.env.REDIS_URL,
          defaultJobOptions: {
            removeOnComplete: 20,
            removeOnFail: 50,
            attempts: 5,
            backoff: {
              type: 'exponential',
              delay: 5000
            }
          }
        })
      };

      // Set up event listeners for monitoring
      this.setupEventListeners();

      this.isInitialized = true;
      logger.info('Notification queue system initialized successfully');

    } catch (error) {
      logger.error('Failed to create notification queues:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Set up event listeners for queue monitoring
   */
  setupEventListeners() {
    Object.entries(this.queues).forEach(([queueName, queue]) => {
      // Job completed successfully
      queue.on('completed', (job, result) => {
        logger.info(`${queueName} job completed`, {
          jobId: job.id,
          queueName,
          processingTime: Date.now() - job.processedOn,
          result: typeof result === 'object' ? result : { success: result }
        });
      });

      // Job failed
      queue.on('failed', (job, err) => {
        logger.error(`${queueName} job failed`, {
          jobId: job.id,
          queueName,
          error: err.message,
          attempts: job.attemptsMade,
          maxAttempts: job.opts.attempts,
          data: job.data
        });
      });

      // Job stalled (taking too long)
      queue.on('stalled', (job) => {
        logger.warn(`${queueName} job stalled`, {
          jobId: job.id,
          queueName,
          data: job.data
        });
      });

      // Queue error
      queue.on('error', (error) => {
        logger.error(`${queueName} queue error:`, error);
      });
    });
  }

  /**
   * Add email notification job to queue
   * @param {Object} jobData - Email job data
   * @param {Object} options - Job options
   */
  async addEmailJob(jobData, options = {}) {
    try {
      if (!this.isInitialized || !this.queues.email) {
        logger.warn('Email queue not available, skipping job', { recipient: jobData.to });
        return { success: false, error: 'Queue not initialized', skipped: true };
      }

      const job = await this.queues.email.add('send-email', jobData, {
        priority: this.getPriority(options.priority),
        delay: options.delay || 0,
        attempts: options.attempts || 3,
        ...options
      });

      logger.debug('Email job added to queue', {
        jobId: job.id,
        recipient: jobData.to,
        template: jobData.templateName,
        priority: options.priority
      });

      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error('Failed to add email job to queue:', error);
      throw error;
    }
  }

  /**
   * Add push notification job to queue
   * @param {Object} jobData - Push notification job data
   * @param {Object} options - Job options
   */
  async addPushJob(jobData, options = {}) {
    try {
      if (!this.isInitialized || !this.queues.push) {
        logger.warn('Push queue not available, skipping job', { tokenCount: Array.isArray(jobData.pushTokens) ? jobData.pushTokens.length : 1 });
        return { success: false, error: 'Queue not initialized', skipped: true };
      }

      const job = await this.queues.push.add('send-push', jobData, {
        priority: this.getPriority(options.priority),
        delay: options.delay || 0,
        attempts: options.attempts || 3,
        ...options
      });

      logger.debug('Push notification job added to queue', {
        jobId: job.id,
        tokenCount: Array.isArray(jobData.pushTokens) ? jobData.pushTokens.length : 1,
        title: jobData.notification?.title,
        priority: options.priority
      });

      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error('Failed to add push notification job to queue:', error);
      throw error;
    }
  }

  /**
   * Add in-app notification job to queue
   * @param {Object} jobData - In-app notification job data
   * @param {Object} options - Job options
   */
  async addInAppJob(jobData, options = {}) {
    try {
      if (!this.isInitialized || !this.queues.inapp) {
        logger.warn('In-app queue not available, skipping job', { userId: jobData.userId });
        return { success: false, error: 'Queue not initialized', skipped: true };
      }

      const job = await this.queues.inapp.add('create-notification', jobData, {
        priority: this.getPriority(options.priority),
        delay: options.delay || 0,
        attempts: options.attempts || 2,
        ...options
      });

      logger.debug('In-app notification job added to queue', {
        jobId: job.id,
        userId: jobData.userId,
        type: jobData.type,
        priority: options.priority
      });

      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error('Failed to add in-app notification job to queue:', error);
      throw error;
    }
  }

  /**
   * Add mobile sync job to queue
   * @param {Object} jobData - Sync job data
   * @param {Object} options - Job options
   */
  async addSyncJob(jobData, options = {}) {
    try {
      if (!this.isInitialized || !this.queues.sync) {
        logger.warn('Sync queue not available, skipping job', { userId: jobData.userId, syncType: jobData.syncType });
        return { success: false, error: 'Queue not initialized', skipped: true };
      }

      const job = await this.queues.sync.add('sync-data', jobData, {
        priority: this.getPriority(options.priority),
        delay: options.delay || 0,
        attempts: options.attempts || 5,
        ...options
      });

      logger.debug('Mobile sync job added to queue', {
        jobId: job.id,
        userId: jobData.userId,
        syncType: jobData.syncType,
        priority: options.priority
      });

      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error('Failed to add sync job to queue:', error);
      throw error;
    }
  }

  /**
   * Add bulk notification jobs
   * @param {Array} jobs - Array of job objects
   * @param {string} queueType - Queue type (email, push, inapp)
   */
  async addBulkJobs(jobs, queueType) {
    try {
      if (!this.queues[queueType]) {
        throw new Error(`Invalid queue type: ${queueType}`);
      }

      const queue = this.queues[queueType];
      const bulkJobs = jobs.map(job => ({
        name: `send-${queueType}`,
        data: job.data,
        opts: {
          priority: this.getPriority(job.priority),
          delay: job.delay || 0,
          attempts: job.attempts || 3,
          ...job.options
        }
      }));

      const addedJobs = await queue.addBulk(bulkJobs);

      logger.info(`Bulk ${queueType} jobs added to queue`, {
        count: addedJobs.length,
        queueType
      });

      return {
        success: true,
        jobIds: addedJobs.map(job => job.id),
        count: addedJobs.length
      };
    } catch (error) {
      logger.error(`Failed to add bulk ${queueType} jobs to queue:`, error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   * @param {string} queueName - Queue name (optional, returns all if not specified)
   */
  async getQueueStats(queueName = null) {
    try {
      const stats = {};

      const queuesToCheck = queueName ? [queueName] : Object.keys(this.queues);

      for (const name of queuesToCheck) {
        if (!this.queues[name]) continue;

        const queue = this.queues[name];
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaiting(),
          queue.getActive(),
          queue.getCompleted(),
          queue.getFailed(),
          queue.getDelayed()
        ]);

        stats[name] = {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length,
          total: waiting.length + active.length + completed.length + failed.length + delayed.length
        };
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get queue statistics:', error);
      throw error;
    }
  }

  /**
   * Clean completed and failed jobs
   * @param {string} queueName - Queue name
   * @param {number} grace - Grace period in milliseconds
   */
  async cleanQueue(queueName, grace = 24 * 60 * 60 * 1000) { // 24 hours default
    try {
      if (!this.queues[queueName]) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const queue = this.queues[queueName];
      
      // Clean completed jobs older than grace period
      const completedCleaned = await queue.clean(grace, 'completed');
      
      // Clean failed jobs older than grace period
      const failedCleaned = await queue.clean(grace, 'failed');

      logger.info(`Queue ${queueName} cleaned`, {
        completedCleaned,
        failedCleaned,
        gracePeriod: grace
      });

      return {
        success: true,
        completedCleaned,
        failedCleaned
      };
    } catch (error) {
      logger.error(`Failed to clean queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Pause queue processing
   * @param {string} queueName - Queue name
   */
  async pauseQueue(queueName) {
    try {
      if (!this.queues[queueName]) {
        throw new Error(`Queue ${queueName} not found`);
      }

      await this.queues[queueName].pause();
      logger.info(`Queue ${queueName} paused`);
      
      return { success: true, message: `Queue ${queueName} paused` };
    } catch (error) {
      logger.error(`Failed to pause queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Resume queue processing
   * @param {string} queueName - Queue name
   */
  async resumeQueue(queueName) {
    try {
      if (!this.queues[queueName]) {
        throw new Error(`Queue ${queueName} not found`);
      }

      await this.queues[queueName].resume();
      logger.info(`Queue ${queueName} resumed`);
      
      return { success: true, message: `Queue ${queueName} resumed` };
    } catch (error) {
      logger.error(`Failed to resume queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Get job by ID
   * @param {string} queueName - Queue name
   * @param {string} jobId - Job ID
   */
  async getJob(queueName, jobId) {
    try {
      if (!this.queues[queueName]) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const job = await this.queues[queueName].getJob(jobId);
      
      if (!job) {
        return { success: false, message: 'Job not found' };
      }

      return {
        success: true,
        job: {
          id: job.id,
          name: job.name,
          data: job.data,
          opts: job.opts,
          progress: job.progress(),
          attemptsMade: job.attemptsMade,
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
          failedReason: job.failedReason
        }
      };
    } catch (error) {
      logger.error(`Failed to get job ${jobId} from queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Convert priority string to number
   * @param {string} priority - Priority string
   * @returns {number} Priority number (higher = more priority)
   */
  getPriority(priority) {
    const priorities = {
      low: 1,
      normal: 5,
      high: 10,
      critical: 20
    };
    return priorities[priority] || priorities.normal;
  }

  /**
   * Close all queues and Redis connection
   */
  async close() {
    try {
      // Close all queues
      await Promise.all(
        Object.values(this.queues).map(queue => queue.close())
      );

      // Close Redis connection
      if (this.redis) {
        await this.redis.quit();
      }

      logger.info('Notification queue system closed successfully');
    } catch (error) {
      logger.error('Error closing notification queue system:', error);
      throw error;
    }
  }

  /**
   * Health check for queue system
   */
  async healthCheck() {
    try {
      // Check Redis connection
      const redisStatus = await this.redis.ping();
      
      // Check queue status
      const queueStats = await this.getQueueStats();
      
      return {
        success: true,
        redis: redisStatus === 'PONG',
        queues: Object.keys(this.queues).length,
        stats: queueStats,
        initialized: this.isInitialized
      };
    } catch (error) {
      logger.error('Queue system health check failed:', error);
      return {
        success: false,
        error: error.message,
        initialized: this.isInitialized
      };
    }
  }
}

// Create singleton instance
const notificationQueue = new NotificationQueue();

module.exports = notificationQueue;