const Redis = require('ioredis');
const logger = require('./logger');

/**
 * Redis Client Singleton
 * 
 * Provides a centralized Redis connection for:
 * - JWT blacklist management
 * - Token validation caching
 * - Session management
 */
class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initialize Redis connection
   * 
   * @returns {Redis} Redis client instance
   */
  initialize() {
    if (this.client) {
      return this.client;
    }

    try {
      // Check if Redis URL is provided
      if (process.env.REDIS_URL) {
        this.client = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 100,
          enableReadyCheck: false,
          lazyConnect: false
        });
      } else {
        // Use individual Redis configuration
        const redisConfig = {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD,
          db: process.env.REDIS_DB || 0,
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 100,
          enableReadyCheck: false
        };

        this.client = new Redis(redisConfig);
      }

      // Handle connection events
      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis client connected successfully');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        logger.error('Redis client error:', error);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis client connection closed');
      });

      return this.client;
    } catch (error) {
      logger.error('Failed to initialize Redis client:', error);
      this.client = null;
      this.isConnected = false;
      return null;
    }
  }

  /**
   * Get Redis client instance
   * 
   * @returns {Redis|null} Redis client or null if not initialized
   */
  getClient() {
    if (!this.client) {
      return this.initialize();
    }
    return this.client;
  }

  /**
   * Check if Redis is connected
   * 
   * @returns {boolean} Connection status
   */
  isReady() {
    return this.isConnected && this.client && this.client.status === 'ready';
  }

  /**
   * Disconnect Redis client
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis client disconnected');
    }
  }
}

// Export singleton instance
module.exports = new RedisClient();
