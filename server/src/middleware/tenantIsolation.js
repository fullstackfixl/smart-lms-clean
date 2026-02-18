/**
 * Tenant Isolation Middleware
 * Automatically filters queries by organization context
 */

const tenantMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.error('Authentication required', 'Access denied', 401);
  }

  // Extract organization from user
  const organizationId = req.user.organization_id;
  const isPublic = req.user.role === 'public_student';

  // Create tenant filter object
  req.tenantFilter = {
    organizationId: organizationId || null,
    isPublic: isPublic
  };

  // For organization users, set organization filter
  if (organizationId) {
    req.organizationFilter = { organization_id: organizationId };
  }

  // For public students, set public filter
  if (isPublic) {
    req.publicFilter = { organization_id: null };
  }

  next();
};

/**
 * Helper function to apply tenant filter to query
 * @param {Object} query - Mongoose query object
 * @param {Object} tenantFilter - Tenant filter from request
 * @returns {Object} Modified query
 */
const applyTenantFilter = (query, tenantFilter) => {
  if (tenantFilter.isPublic) {
    // Public students can only access public content
    query.organization_id = null;
  } else if (tenantFilter.organizationId) {
    // Organization users can only access their organization's content
    query.organization_id = tenantFilter.organizationId;
  }
  return query;
};

module.exports = {
  tenantMiddleware,
  applyTenantFilter
};
