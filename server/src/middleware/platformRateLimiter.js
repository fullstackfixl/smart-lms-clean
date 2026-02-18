/**
 * Rate Limiter for Platform Admin Routes
 * Stricter limits for sensitive administrative operations
 */

const rateLimit = require('express-rate-limit');

// Strict rate limiter for platform admin routes
const platformAdminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

// Very strict rate limiter for sensitive operations (create, delete, suspend)
const platformAdminStrictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    success: false,
    message: 'Too many sensitive operations from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for organization creation
const organizationCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit to 10 organization creations per hour
  message: {
    success: false,
    message: 'Organization creation limit reached, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  platformAdminLimiter,
  platformAdminStrictLimiter,
  organizationCreationLimiter
};
