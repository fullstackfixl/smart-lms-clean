const { AuthenticationError, ForbiddenError } = require('../core/errors');

/**
 * Middleware to enforce organization isolation.
 * Ensures that all queries for organization-specific roles include organization_id filter.
 */
const tenantIsolation = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Platform Admin has global access
  if (req.user.role === 'platform_admin') {
    return next();
  }

  // Ensure organization_id is present for other roles
  if (!req.user.organization_id) {
    return res.status(403).json({ success: false, message: 'Organization affiliation required' });
  }

  // Add organization filter to req for controllers to use
  req.orgFilter = { organization_id: req.user.organization_id };

  next();
};

module.exports = tenantIsolation;
