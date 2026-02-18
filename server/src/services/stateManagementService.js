const Redis = require('ioredis');
const logger = require('../utils/logger');

/**
 * State Management Service
 * Handles backend state management using Redis cache
 * Implements section 8.2.2 Backend State Management
 */
class StateManagementService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.sessionPrefix = 'session:';
    this.socketPrefix = 'socket:';
    this.cachePrefix = 'cache:';
    this.lockPrefix = 'lock:';
  }

  /**
   * Initialize Redis connection for state management
   */
  async initialize() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        lazyConnect: false
      };

      // Use Redis URL if provided
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, redisConfig);
      } else {
        this.redis = new Redis(redisConfig);
      }

      // Test connection
      await this.redis.ping();
      this.isConnected = true;
      logger.info('State Management Service: Redis connected successfully');

      // Set up error handlers
      this.redis.on('error', (error) => {
        logger.error('State Management Service: Redis error', error);
        this.isConnected = false;
      });

      this.redis.on('connect', () => {
        logger.info('State Management Service: Redis connected');
        this.isConnected = true;
      });

      this.redis.on('disconnect', () => {
        logger.warn('State Management Service: Redis disconnected');
        this.isConnected = false;
      });

    } catch (error) {
      logger.error('State Management Service: Failed to initialize Redis', error);
      this.isConnected = false;
    }
  }

  /**
   * Session Management
   * Store and retrieve user session data
   */

  // Store user session
  async setSession(userId, sessionData, ttl = 604800) { // 7 days default
    if (!this.isConnected) return false;

    try {
      const key = `${this.sessionPrefix}${userId}`;
      const data = JSON.stringify({
        ...sessionData,
        lastActivity: Date.now()
      });

      await this.redis.setex(key, ttl, data);
      logger.debug('Session stored', { userId, ttl });
      return true;
    } catch (error) {
      logger.error('Failed to store session', { userId, error: error.message });
      return false;
    }
  }

  // Get user session
  async getSession(userId) {
    if (!this.isConnected) return null;

    try {
      const key = `${this.sessionPrefix}${userId}`;
      const data = await this.redis.get(key);
      
      if (!data) return null;

      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to get session', { userId, error: error.message });
      return null;
    }
  }

  // Update session activity
  async updateSessionActivity(userId) {
    if (!this.isConnected) return false;

    try {
      const session = await this.getSession(userId);
      if (!session) return false;

      session.lastActivity = Date.now();
      await this.setSession(userId, session);
      return true;
    } catch (error) {
      logger.error('Failed to update session activity', { userId, error: error.message });
      return false;
    }
  }

  // Delete user session
  async deleteSession(userId) {
    if (!this.isConnected) return false;

    try {
      const key = `${this.sessionPrefix}${userId}`;
      await this.redis.del(key);
      logger.debug('Session deleted', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to delete session', { userId, error: error.message });
      return false;
    }
  }

  /**
   * Socket.io State Management
   * Store and retrieve real-time connection state
   */

  // Store socket connection
  async setSocketConnection(userId, socketId, metadata = {}) {
    if (!this.isConnected) return false;

    try {
      const key = `${this.socketPrefix}user:${userId}`;
      const data = JSON.stringify({
        socketId,
        connectedAt: Date.now(),
        ...metadata
      });

      await this.redis.setex(key, 3600, data); // 1 hour TTL
      
      // Also store reverse mapping (socketId -> userId)
      const reverseKey = `${this.socketPrefix}socket:${socketId}`;
      await this.redis.setex(reverseKey, 3600, userId);

      logger.debug('Socket connection stored', { userId, socketId });
      return true;
    } catch (error) {
      logger.error('Failed to store socket connection', { userId, error: error.message });
      return false;
    }
  }

  // Get socket connection by userId
  async getSocketConnection(userId) {
    if (!this.isConnected) return null;

    try {
      const key = `${this.socketPrefix}user:${userId}`;
      const data = await this.redis.get(key);
      
      if (!data) return null;

      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to get socket connection', { userId, error: error.message });
      return null;
    }
  }

  // Get userId by socketId
  async getUserBySocketId(socketId) {
    if (!this.isConnected) return null;

    try {
      const key = `${this.socketPrefix}socket:${socketId}`;
      return await this.redis.get(key);
    } catch (error) {
      logger.error('Failed to get user by socket', { socketId, error: error.message });
      return null;
    }
  }

  // Delete socket connection
  async deleteSocketConnection(userId, socketId) {
    if (!this.isConnected) return false;

    try {
      const userKey = `${this.socketPrefix}user:${userId}`;
      const socketKey = `${this.socketPrefix}socket:${socketId}`;
      
      await this.redis.del(userKey);
      await this.redis.del(socketKey);
      
      logger.debug('Socket connection deleted', { userId, socketId });
      return true;
    } catch (error) {
      logger.error('Failed to delete socket connection', { userId, error: error.message });
      return false;
    }
  }

  // Check if user is online
  async isUserOnline(userId) {
    if (!this.isConnected) return false;

    try {
      const key = `${this.socketPrefix}user:${userId}`;
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Failed to check user online status', { userId, error: error.message });
      return false;
    }
  }

  /**
   * Cache Management
   * Store and retrieve cached data
   */

  // Set cache
  async setCache(key, value, ttl = 3600) {
    if (!this.isConnected) return false;

    try {
      const cacheKey = `${this.cachePrefix}${key}`;
      const data = JSON.stringify(value);
      
      await this.redis.setex(cacheKey, ttl, data);
      logger.debug('Cache set', { key, ttl });
      return true;
    } catch (error) {
      logger.error('Failed to set cache', { key, error: error.message });
      return false;
    }
  }

  // Get cache
  async getCache(key) {
    if (!this.isConnected) return null;

    try {
      const cacheKey = `${this.cachePrefix}${key}`;
      const data = await this.redis.get(cacheKey);
      
      if (!data) return null;

      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to get cache', { key, error: error.message });
      return null;
    }
  }

  // Delete cache
  async deleteCache(key) {
    if (!this.isConnected) return false;

    try {
      const cacheKey = `${this.cachePrefix}${key}`;
      await this.redis.del(cacheKey);
      logger.debug('Cache deleted', { key });
      return true;
    } catch (error) {
      logger.error('Failed to delete cache', { key, error: error.message });
      return false;
    }
  }

  // Clear cache by pattern
  async clearCacheByPattern(pattern) {
    if (!this.isConnected) return false;

    try {
      const cachePattern = `${this.cachePrefix}${pattern}`;
      const keys = await this.redis.keys(cachePattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.debug('Cache cleared by pattern', { pattern, count: keys.length });
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to clear cache by pattern', { pattern, error: error.message });
      return false;
    }
  }

  /**
   * Distributed Locking
   * Implement distributed locks for atomic operations
   */

  // Acquire lock
  async acquireLock(resource, ttl = 10000) {
    if (!this.isConnected) return null;

    try {
      const lockKey = `${this.lockPrefix}${resource}`;
      const lockValue = `${Date.now()}-${Math.random()}`;
      
      // Try to set lock with NX (only if not exists)
      const result = await this.redis.set(lockKey, lockValue, 'PX', ttl, 'NX');
      
      if (result === 'OK') {
        logger.debug('Lock acquired', { resource, lockValue, ttl });
        return lockValue;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to acquire lock', { resource, error: error.message });
      return null;
    }
  }

  // Release lock
  async releaseLock(resource, lockValue) {
    if (!this.isConnected) return false;

    try {
      const lockKey = `${this.lockPrefix}${resource}`;
      
      // Use Lua script to ensure atomic check-and-delete
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await this.redis.eval(script, 1, lockKey, lockValue);
      
      if (result === 1) {
        logger.debug('Lock released', { resource, lockValue });
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to release lock', { resource, error: error.message });
      return false;
    }
  }

  // Execute with lock
  async executeWithLock(resource, callback, ttl = 10000) {
    const lockValue = await this.acquireLock(resource, ttl);
    
    if (!lockValue) {
      throw new Error(`Failed to acquire lock for resource: ${resource}`);
    }

    try {
      const result = await callback();
      return result;
    } finally {
      await this.releaseLock(resource, lockValue);
    }
  }

  /**
   * Pub/Sub for real-time events
   */

  // Publish event
  async publish(channel, message) {
    if (!this.isConnected) return false;

    try {
      const data = JSON.stringify(message);
      await this.redis.publish(channel, data);
      logger.debug('Event published', { channel });
      return true;
    } catch (error) {
      logger.error('Failed to publish event', { channel, error: error.message });
      return false;
    }
  }

  // Subscribe to channel
  async subscribe(channel, callback) {
    if (!this.isConnected) return false;

    try {
      // Create a new Redis connection for subscription
      const subscriber = this.redis.duplicate();
      
      subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          try {
            const data = JSON.parse(message);
            callback(data);
          } catch (error) {
            logger.error('Failed to parse subscribed message', { channel, error: error.message });
          }
        }
      });

      await subscriber.subscribe(channel);
      logger.debug('Subscribed to channel', { channel });
      
      return subscriber;
    } catch (error) {
      logger.error('Failed to subscribe to channel', { channel, error: error.message });
      return false;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.isConnected) {
      return { status: 'disconnected', message: 'Redis not connected' };
    }

    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency: `${latency}ms`,
        connected: true
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
        connected: false
      };
    }
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
      logger.info('State Management Service: Redis disconnected');
    }
  }
}

// Create singleton instance
const stateManagementService = new StateManagementService();

module.exports = stateManagementService;
