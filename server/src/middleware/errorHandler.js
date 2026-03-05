const logger = require('../utils/logger');
const notificationService = require('../utils/notificationService');

/**
 * Global Error Handler Middleware
 * Handles all unhandled errors in the application
 */
class ErrorHandler {

  /**
   * Main error handling middleware
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static handle(err, req, res, next) {
    // Log error with context
    const errorContext = {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      userId: req.user?.id,
      organizationId: req.user?.organization_id,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    };

    // Determine error severity
    const severity = ErrorHandler.getErrorSeverity(err);

    // Log based on severity
    if (severity === 'critical') {
      logger.error('CRITICAL ERROR', errorContext);
      // Send immediate notification to admins for critical errors
      ErrorHandler.notifyCriticalError(err, errorContext);
    } else if (severity === 'high') {
      logger.error('HIGH SEVERITY ERROR', errorContext);
    } else {
      logger.warn('APPLICATION ERROR', errorContext);
    }

    // Determine response based on error type
    const errorResponse = ErrorHandler.formatErrorResponse(err);

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && errorResponse.status >= 500) {
      errorResponse.error = 'Internal server error';
      errorResponse.message = 'Something went wrong. Please try again later.';
      // Remove stack trace in production
      delete errorResponse.stack;
    }

    res.status(errorResponse.status).json({
      success: false,
      error: errorResponse.error,
      message: errorResponse.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  /**
   * Determine error severity level
   * @param {Error} err - Error object
   * @returns {string} Severity level
   */
  static getErrorSeverity(err) {
    // Critical errors that require immediate attention
    const criticalErrors = [
      'ECONNREFUSED', // Database connection failed
      'ENOTFOUND',    // DNS resolution failed
      'ENOMEM',       // Out of memory
      'EMFILE',       // Too many open files
      'MongoNetworkError',
      'MongoServerSelectionError'
    ];

    // High severity errors
    const highSeverityErrors = [
      'ValidationError',
      'CastError',
      'MongoError',
      'JsonWebTokenError',
      'TokenExpiredError'
    ];

    if (criticalErrors.some(code => err.code === code || err.name === code)) {
      return 'critical';
    }

    if (highSeverityErrors.some(name => err.name === name)) {
      return 'high';
    }

    if (err.status >= 500) {
      return 'high';
    }

    return 'medium';
  }

  /**
   * Format error response based on error type
   * @param {Error} err - Error object
   * @returns {Object} Formatted error response
   */
  static formatErrorResponse(err) {
    // Validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return {
        status: 400,
        error: 'Validation failed',
        message: 'Please check your input data',
        details: errors
      };
    }

    // MongoDB cast errors
    if (err.name === 'CastError') {
      return {
        status: 400,
        error: 'Invalid data format',
        message: `Invalid ${err.path}: ${err.value}`
      };
    }

    // MongoDB duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return {
        status: 409,
        error: 'Duplicate entry',
        message: `${field} already exists`
      };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      return {
        status: 401,
        error: 'Invalid token',
        message: 'Please log in again'
      };
    }

    if (err.name === 'TokenExpiredError') {
      return {
        status: 401,
        error: 'Token expired',
        message: 'Your session has expired. Please log in again'
      };
    }

    // Rate limiting errors
    if (err.status === 429) {
      return {
        status: 429,
        error: 'Too many requests',
        message: 'Please try again later'
      };
    }

    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return {
        status: 413,
        error: 'File too large',
        message: 'The uploaded file is too large'
      };
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return {
        status: 400,
        error: 'Invalid file',
        message: 'Unexpected file field'
      };
    }

    // Payment errors
    if (err.type === 'StripeCardError') {
      return {
        status: 400,
        error: 'Payment failed',
        message: err.message
      };
    }

    // Default error handling
    return {
      status: err.status || err.statusCode || 500,
      error: err.message || 'Internal server error',
      message: err.message || 'Something went wrong'
    };
  }

  /**
   * Send critical error notifications to administrators
   * @param {Error} err - Error object
   * @param {Object} context - Error context
   */
  static async notifyCriticalError(err, context) {
    try {
      // Only send notifications in production or when explicitly enabled
      if (process.env.NODE_ENV !== 'production' && !process.env.ENABLE_ERROR_NOTIFICATIONS) {
        return;
      }

      // Find admin users to notify
      const User = require('../models/User');
      const admins = await User.find({
        role: 'org_admin',
        is_active: true,
        organization_id: context.organizationId
      }).select('_id');

      if (admins.length === 0) {
        return;
      }

      const adminIds = admins.map(admin => admin._id);

      // Send notification to admins
      await notificationService.sendNotification(
        adminIds,
        'system_alert',
        {
          organizationId: context.organizationId,
          title: 'Critical System Error',
          message: `Critical error occurred: ${err.message}`,
          templateData: {
            alertType: 'Critical Error',
            message: err.message,
            severity: 'critical',
            timestamp: context.timestamp,
            url: context.url,
            method: context.method,
            userId: context.userId,
            organizationName: 'Smart LMS'
          }
        },
        ['email', 'in_app'],
        { priority: 'critical' }
      );

    } catch (notificationError) {
      logger.error('Failed to send critical error notification:', {
        originalError: err.message,
        notificationError: notificationError.message
      });
    }
  }

  /**
   * Handle uncaught exceptions
   * @param {Error} err - Uncaught exception
   */
  static handleUncaughtException(err) {
    logger.error('UNCAUGHT EXCEPTION - Server will exit', {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });

    // Graceful shutdown
    process.exit(1);
  }

  /**
   * Handle unhandled promise rejections
   * @param {Error} reason - Rejection reason
   * @param {Promise} promise - Rejected promise
   */
  static handleUnhandledRejection(reason, promise) {
    logger.error('UNHANDLED PROMISE REJECTION', {
      reason: reason.message || reason,
      stack: reason.stack,
      promise: promise.toString(),
      timestamp: new Date().toISOString()
    });

    // Don't exit immediately for promise rejections
    // Log and continue, but monitor for patterns
  }

  /**
   * Handle 404 errors (route not found)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static handle404(req, res) {
    const context = {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    logger.warn('404 - Route not found', context);

    res.status(404).json({
      success: false,
      error: 'Route not found',
      message: 'The requested endpoint does not exist'
    });
  }

  /**
   * Request timeout handler
   * @param {number} timeout - Timeout in milliseconds
   */
  static timeoutHandler(timeout = 30000) {
    return (req, res, next) => {
      const timer = setTimeout(() => {
        if (!res.headersSent) {
          logger.warn('Request timeout', {
            url: req.url,
            method: req.method,
            timeout: timeout,
            timestamp: new Date().toISOString()
          });

          res.status(408).json({
            success: false,
            error: 'Request timeout',
            message: 'The request took too long to process'
          });
        }
      }, timeout);

      res.on('finish', () => {
        clearTimeout(timer);
      });

      next();
    };
  }

  /**
   * Async error wrapper for route handlers
   * @param {Function} fn - Async route handler
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Get error statistics for monitoring
   * @param {string} organizationId - Organization ID (optional)
   */
  static async getErrorStats(organizationId = null) {
    try {
      // This would typically query a logging database
      // For now, return basic stats
      return {
        success: true,
        stats: {
          total_errors: 0,
          critical_errors: 0,
          error_rate: 0,
          most_common_errors: [],
          last_24h_errors: 0
        }
      };
    } catch (error) {
      logger.error('Failed to get error statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ErrorHandler;