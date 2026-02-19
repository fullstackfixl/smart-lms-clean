const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Winston Logger Configuration
 * Provides structured logging with file rotation and multiple transports
 */
class Logger {
  constructor() {
    this.logger = this.createLogger();
  }

  createLogger() {
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.prettyPrint()
    );

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'HH:mm:ss'
      }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let metaStr = '';
        if (Object.keys(meta).length > 0) {
          metaStr = '\n' + JSON.stringify(meta, null, 2);
        }
        return `${timestamp} [${level}]: ${message}${metaStr}`;
      })
    );

    const logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: {
        service: 'smart-lms-api',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
      },
      transports: [
        // Console logging with colors
        new winston.transports.Console({
          format: consoleFormat,
          level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
        }),

        // Error log file
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          maxsize: parseInt(process.env.LOG_FILE_MAX_SIZE) || 5242880, // 5MB
          maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
          format: logFormat
        }),

        // Combined log file
        new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
          maxsize: parseInt(process.env.LOG_FILE_MAX_SIZE) || 5242880, // 5MB
          maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
          format: logFormat
        }),

        // Daily rotate file for production
        ...(process.env.NODE_ENV === 'production' ? [
          new winston.transports.File({
            filename: path.join(logsDir, 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            format: logFormat
          })
        ] : [])
      ],

      // Handle uncaught exceptions and rejections
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(logsDir, 'exceptions.log'),
          format: logFormat
        })
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(logsDir, 'rejections.log'),
          format: logFormat
        })
      ]
    });

    // Add MongoDB transport for production error logging
    if (process.env.NODE_ENV === 'production' && process.env.MONGODB_URI) {
      try {
        const { MongoDB } = require('winston-mongodb');
        logger.add(new MongoDB({
          db: process.env.MONGODB_URI,
          collection: 'logs',
          level: 'error',
          options: {
            // No deprecated options - mongoose driver handles this automatically
          },
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
          expireAfterSeconds: 2592000 // 30 days
        }));
      } catch (error) {
        console.warn('MongoDB logging transport not available:', error.message);
      }
    }

    return logger;
  }

  /**
   * Log error with context
   * @param {string} message - Error message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    this.logger.error(message, this.sanitizeMeta(meta));
  }

  /**
   * Log warning with context
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    this.logger.warn(message, this.sanitizeMeta(meta));
  }

  /**
   * Log info with context
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    this.logger.info(message, this.sanitizeMeta(meta));
  }

  /**
   * Log debug with context
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    this.logger.debug(message, this.sanitizeMeta(meta));
  }

  /**
   * Log HTTP request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} responseTime - Response time in ms
   */
  logRequest(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id,
      organizationId: req.user?.organization_id
    };

    if (res.statusCode >= 400) {
      this.error(`HTTP ${res.statusCode} - ${req.method} ${req.url}`, meta);
    } else {
      this.info(`HTTP ${res.statusCode} - ${req.method} ${req.url}`, meta);
    }
  }

  /**
   * Log database operation
   * @param {string} operation - Database operation (find, create, update, delete)
   * @param {string} collection - Collection name
   * @param {Object} meta - Additional metadata
   */
  logDatabase(operation, collection, meta = {}) {
    this.debug(`DB ${operation.toUpperCase()} - ${collection}`, {
      operation,
      collection,
      ...this.sanitizeMeta(meta)
    });
  }

  /**
   * Log authentication event
   * @param {string} event - Auth event (login, logout, register, etc.)
   * @param {Object} meta - Additional metadata
   */
  logAuth(event, meta = {}) {
    this.info(`AUTH ${event.toUpperCase()}`, {
      event,
      ...this.sanitizeMeta(meta)
    });
  }

  /**
   * Log payment event
   * @param {string} event - Payment event
   * @param {Object} meta - Additional metadata
   */
  logPayment(event, meta = {}) {
    this.info(`PAYMENT ${event.toUpperCase()}`, {
      event,
      ...this.sanitizeMeta(meta)
    });
  }

  /**
   * Log notification event
   * @param {string} event - Notification event
   * @param {Object} meta - Additional metadata
   */
  logNotification(event, meta = {}) {
    this.info(`NOTIFICATION ${event.toUpperCase()}`, {
      event,
      ...this.sanitizeMeta(meta)
    });
  }

  /**
   * Log security event
   * @param {string} event - Security event
   * @param {Object} meta - Additional metadata
   */
  logSecurity(event, meta = {}) {
    this.warn(`SECURITY ${event.toUpperCase()}`, {
      event,
      ...this.sanitizeMeta(meta)
    });
  }

  /**
   * Log performance metric
   * @param {string} metric - Metric name
   * @param {number} value - Metric value
   * @param {Object} meta - Additional metadata
   */
  logPerformance(metric, value, meta = {}) {
    this.info(`PERFORMANCE ${metric}`, {
      metric,
      value,
      unit: meta.unit || 'ms',
      ...this.sanitizeMeta(meta)
    });
  }

  /**
   * Sanitize metadata to remove sensitive information
   * @param {Object} meta - Metadata object
   * @returns {Object} Sanitized metadata
   */
  sanitizeMeta(meta) {
    if (!meta || typeof meta !== 'object') {
      return meta;
    }

    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'authorization',
      'cookie', 'session', 'credit_card', 'cvv', 'ssn'
    ];

    const sanitized = { ...meta };
    const seen = new WeakSet(); // Track visited objects to prevent circular references

    const sanitizeObject = (obj, path = '', depth = 0) => {
      // Prevent infinite recursion - max depth of 10
      if (depth > 10) {
        return '[MAX_DEPTH]';
      }

      // Handle null or undefined
      if (obj === null || obj === undefined) {
        return obj;
      }

      // Handle circular references
      if (typeof obj === 'object') {
        if (seen.has(obj)) {
          return '[CIRCULAR]'; // Mark circular references
        }
        seen.add(obj);
      }

      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map((item, index) => {
          if (item && typeof item === 'object') {
            return sanitizeObject(item, `${path}[${index}]`, depth + 1);
          }
          return item;
        });
      }

      // Handle objects
      if (typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          const fullPath = path ? `${path}.${key}` : key;
          const lowerKey = key.toLowerCase();

          // Check if field is sensitive
          if (sensitiveFields.some(field => lowerKey.includes(field))) {
            result[key] = '[REDACTED]';
          } else if (value && typeof value === 'object') {
            result[key] = sanitizeObject(value, fullPath, depth + 1);
          } else {
            result[key] = value;
          }
        }
        return result;
      }

      return obj;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Create child logger with additional default metadata
   * @param {Object} defaultMeta - Default metadata for child logger
   * @returns {Object} Child logger instance
   */
  child(defaultMeta) {
    return {
      error: (message, meta = {}) => this.error(message, { ...defaultMeta, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { ...defaultMeta, ...meta }),
      info: (message, meta = {}) => this.info(message, { ...defaultMeta, ...meta }),
      debug: (message, meta = {}) => this.debug(message, { ...defaultMeta, ...meta })
    };
  }

  /**
   * Get logger statistics
   * @returns {Object} Logger statistics
   */
  getStats() {
    return {
      level: this.logger.level,
      transports: this.logger.transports.length,
      logsDirectory: logsDir
    };
  }

  /**
   * Flush all log transports
   */
  async flush() {
    return new Promise((resolve) => {
      this.logger.on('finish', resolve);
      this.logger.end();
    });
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;