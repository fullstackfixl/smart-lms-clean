const express = require('express');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const ErrorHandler = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /api/errors/frontend - Log frontend errors
 * Receives error reports from the frontend and logs them appropriately
 */
router.post('/frontend', [
  body('message').notEmpty().withMessage('Error message is required'),
  body('stack').optional().isString(),
  body('url').optional().isURL(),
  body('userAgent').optional().isString(),
  body('timestamp').optional().isISO8601(),
  body('userId').optional().isString(),
  body('sessionId').optional().isString(),
  body('componentStack').optional().isString(),
  body('additionalInfo').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid error report data',
        details: errors.array()
      });
    }

    const {
      message,
      stack,
      url,
      userAgent,
      timestamp,
      userId,
      sessionId,
      componentStack,
      additionalInfo
    } = req.body;

    // Create error context
    const errorContext = {
      type: 'frontend_error',
      message,
      stack,
      url,
      userAgent,
      timestamp: timestamp || new Date().toISOString(),
      userId,
      sessionId,
      componentStack,
      additionalInfo,
      ip: req.ip || req.connection.remoteAddress,
      organizationId: req.user?.organization_id
    };

    // Determine error severity based on message content
    const severity = this.determineFrontendErrorSeverity(message, stack);

    // Log the error
    if (severity === 'critical') {
      logger.error('CRITICAL FRONTEND ERROR', errorContext);
    } else if (severity === 'high') {
      logger.error('FRONTEND ERROR', errorContext);
    } else {
      logger.warn('FRONTEND WARNING', errorContext);
    }

    // Store in database if needed (for error analytics)
    // This could be implemented later for error tracking dashboard

    res.json({
      success: true,
      message: 'Error logged successfully',
      data: {
        errorId: Date.now().toString(36),
        severity,
        timestamp: errorContext.timestamp
      }
    });

  } catch (error) {
    logger.error('Failed to log frontend error:', {
      error: error.message,
      originalError: req.body
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to log error'
    });
  }
});

/**
 * GET /api/errors/stats - Get error statistics
 * Returns error statistics for monitoring dashboard
 */
router.get('/stats', async (req, res) => {
  try {
    const organizationId = req.user?.organization_id;
    const stats = await ErrorHandler.getErrorStats(organizationId);
    
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get error statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get error statistics'
    });
  }
});

/**
 * POST /api/errors/test - Test error handling (development only)
 * Allows testing of error handling in development
 */
router.post('/test', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Not allowed in production',
      message: 'Error testing is only available in development'
    });
  }

  const { type = 'generic' } = req.body;

  try {
    switch (type) {
      case 'validation':
        throw new Error('Test validation error');
      
      case 'database':
        const error = new Error('Test database error');
        error.name = 'MongoError';
        throw error;
      
      case 'auth':
        const authError = new Error('Test authentication error');
        authError.name = 'JsonWebTokenError';
        throw authError;
      
      case 'async':
        // Test async error
        setTimeout(() => {
          throw new Error('Test async error');
        }, 100);
        break;
      
      case 'critical':
        const criticalError = new Error('Test critical error');
        criticalError.code = 'ECONNREFUSED';
        throw criticalError;
      
      default:
        throw new Error('Test generic error');
    }

    res.json({
      success: true,
      message: `Test ${type} error triggered`
    });

  } catch (error) {
    // Let the global error handler catch this
    throw error;
  }
});

/**
 * Determine frontend error severity
 * @param {string} message - Error message
 * @param {string} stack - Error stack trace
 * @returns {string} Severity level
 */
function determineFrontendErrorSeverity(message, stack) {
  const criticalPatterns = [
    /network error/i,
    /failed to fetch/i,
    /script error/i,
    /chunkloaderror/i,
    /loading chunk \d+ failed/i
  ];

  const highSeverityPatterns = [
    /typeerror/i,
    /referenceerror/i,
    /syntaxerror/i,
    /cannot read prop/i,
    /undefined is not a function/i
  ];

  const messageToCheck = message.toLowerCase();
  const stackToCheck = (stack || '').toLowerCase();

  if (criticalPatterns.some(pattern => 
    pattern.test(messageToCheck) || pattern.test(stackToCheck)
  )) {
    return 'critical';
  }

  if (highSeverityPatterns.some(pattern => 
    pattern.test(messageToCheck) || pattern.test(stackToCheck)
  )) {
    return 'high';
  }

  return 'medium';
}

module.exports = router;