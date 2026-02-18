/**
 * Performance Monitoring Middleware
 * Tracks request duration and logs slow requests
 */

const logger = require('../utils/logger');

// Track request duration
const requestDuration = (req, res, next) => {
  const start = Date.now();

  // Override res.json to capture response time
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        user: req.user?._id,
        ip: req.ip
      });
    }

    // Add response time header
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    return originalJson.call(this, data);
  };

  next();
};

// Request size limiter
const requestSizeLimiter = (maxSize = 10 * 1024 * 1024) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        error: 'Request entity too large',
        message: `Maximum request size is ${maxSize / 1024 / 1024}MB`
      });
    }
    
    next();
  };
};

// Memory usage monitor
const memoryMonitor = () => {
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  };

  // Warn if memory usage is high
  if (memUsageMB.heapUsed > 1024) {
    logger.warn('High memory usage detected', memUsageMB);
  }

  return memUsageMB;
};

// Start memory monitoring (every 5 minutes)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    memoryMonitor();
  }, 5 * 60 * 1000);
}

// Compression middleware configuration
const compressionOptions = {
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all responses
    return true;
  }
};

module.exports = {
  requestDuration,
  requestSizeLimiter,
  memoryMonitor,
  compressionOptions
};
