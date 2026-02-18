/**
 * Caching Utility
 * Provides Redis-based caching with fallback to in-memory cache
 */

const Redis = require('ioredis');
const logger = require('./logger');

class CacheService {
  constructor() {
    this.redis = null;
    this.memoryCache = new Map();
    this.isRedisConnected = false;
    
    this.initRedis();
  }

  initRedis() {
    if (!process.env.REDIS_URL) {
      logger.warn('Redis URL not configured, using in-memory cache');
      return;
    }

    try {
      this.redis = new Redis(process.env.REDIS_URL, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true
      });

      this.redis.on('connect', () => {
        this.isRedisConnected = true;
        logger.info('Redis connected successfully');
      });

      this.redis.on('error', (err) => {
        this.isRedisConnected = false;
        logger.error('Redis connection error:', err);
      });

      this.redis.on('close', () => {
        this.isRedisConnected = false;
        logger.warn('Redis connection closed');
      });

      // Connect to Redis
      this.redis.connect().catch(err => {
        logger.error('Failed to connect to Redis:', err);
      });
    } catch (error) {
      logger.error('Redis initialization error:', error);
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      if (this.isRedisConnected && this.redis) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      }
      
      // Fallback to memory cache
      return this.memoryCache.get(key) || null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL (in seconds)
   */
  async set(key, value, ttl = 3600) {
    try {
      const serialized = JSON.stringify(value);
      
      if (this.isRedisConnected && this.redis) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        // Fallback to memory cache
        this.memoryCache.set(key, value);
        
        // Auto-expire from memory cache
        setTimeout(() => {
          this.memoryCache.delete(key);
        }, ttl * 1000);
      }
      
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key) {
    try {
      if (this.isRedisConnected && this.redis) {
        await this.redis.del(key);
      }
      
      this.memoryCache.delete(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern) {
    try {
      if (this.isRedisConnected && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
      
      // Clear matching keys from memory cache
      for (const key of this.memoryCache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
          this.memoryCache.delete(key);
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Cache pattern delete error:', error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async flush() {
    try {
      if (this.isRedisConnected && this.redis) {
        await this.redis.flushdb();
      }
      
      this.memoryCache.clear();
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Cache middleware for Express routes
   */
  middleware(duration = 300) {
    return async (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      const key = `cache:${req.originalUrl}`;
      
      try {
        const cached = await this.get(key);
        
        if (cached) {
          return res.json(cached);
        }

        // Store original res.json
        const originalJson = res.json.bind(res);

        // Override res.json
        res.json = (body) => {
          // Cache the response
          this.set(key, body, duration).catch(err => {
            logger.error('Failed to cache response:', err);
          });
          
          return originalJson(body);
        };

        next();
      } catch (error) {
        logger.error('Cache middleware error:', error);
        next();
      }
    };
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    const stats = {
      memoryCache: {
        size: this.memoryCache.size,
        keys: Array.from(this.memoryCache.keys())
      },
      redis: {
        connected: this.isRedisConnected
      }
    };

    if (this.isRedisConnected && this.redis) {
      try {
        const info = await this.redis.info('stats');
        stats.redis.info = info;
      } catch (error) {
        logger.error('Failed to get Redis stats:', error);
      }
    }

    return stats;
  }
}

// Export singleton instance
module.exports = new CacheService();
