/**
 * Audit Log Middleware
 * Tracks sensitive operations for compliance and security
 */

const AuditLog = require('../models/AuditLog');

/**
 * Log sensitive operations
 * @param {String} action - Action performed (CREATE, UPDATE, DELETE, SUSPEND, etc.)
 * @param {String} resource - Resource type (organization, user, subscription, etc.)
 */
const auditLog = (action, resource) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Only log if operation was successful
      if (data.success) {
        // Create audit log entry asynchronously (don't block response)
        setImmediate(async () => {
          try {
            await AuditLog.create({
              user_id: req.user?._id,
              user_email: req.user?.email,
              user_role: req.user?.role,
              action,
              resource,
              resource_id: req.params.id || data.data?._id,
              details: {
                method: req.method,
                path: req.path,
                body: sanitizeBody(req.body),
                query: req.query,
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent')
              },
              timestamp: new Date()
            });
          } catch (error) {
            console.error('Audit log error:', error);
            // Don't fail the request if audit logging fails
          }
        });
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
};

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeBody(body) {
  if (!body) return {};
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'api_key'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

module.exports = auditLog;
