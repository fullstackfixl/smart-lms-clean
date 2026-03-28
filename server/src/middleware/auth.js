const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    console.log(`🔐 [Auth] ${req.method} ${req.path}`);

    // Try to get token from Authorization header first, then fall back to cookies
    let token = null;

    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    console.log('🔐 [Auth] Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'MISSING');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('🔐 [Auth] Token from header:', token.substring(0, 20) + '...');
    }

    // Check query parameter (useful for direct downloads/window.open)
    if (!token && req.query.token) {
      token = req.query.token;
      console.log('🔐 [Auth] Token from query:', token.substring(0, 20) + '...');
    }

    // Fall back to cookie if no Authorization header or query token
    if (!token) {
      token = req.cookies.token || req.cookies.instatute_token;
      console.log('🔐 [Auth] Token from cookie:', token ? token.substring(0, 20) + '...' : 'MISSING');
    }

    if (!token) {
      console.log('❌ [Auth] No token provided');
      return res.error('No token provided', 'Authentication required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.user_id || decoded.id || decoded._id || decoded.sub;
    console.log('🔐 [Auth] Token decoded, userId:', userId);

    if (!userId) {
      console.log('❌ [Auth] Token missing user id fields');
      return res.error('Invalid token payload', 'Authentication failed', 401);
    }

    const user = await User.findById(userId).select('-password').populate('organization_id');

    if (!user) {
      console.log('❌ [Auth] User not found for ID:', userId);
      return res.error('User not found', 'Authentication failed', 401);
    }

    if (!user.isActive || user.status === 'suspended' || user.status === 'inactive') {
      console.log('❌ [Auth] User not active or suspended:', user.email, 'Status:', user.status, 'isActive:', user.isActive);
      return res.error('Account deactivated', 'Account access denied', 401);
    }

    // Check if user's organization is soft-deleted
    if (user.organization_id && user.organization_id.is_deleted) {
      console.log('❌ [Auth] Organization soft-deleted:', user.organization_id._id);
      return res.error('Organization no longer active', 'Access denied', 401);
    }

    console.log('✅ [Auth] Authenticated:', user.email, 'Role:', user.role);
    req.user = user;

    // Attach modulesEnabled for moduleGuard middleware
    if (user.organization_id && user.organization_id.modulesEnabled) {
      req.user.modulesEnabled = user.organization_id.modulesEnabled;
    }

    next();
  } catch (error) {
    console.log('❌ [Auth] Error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.error('Invalid token', 'Authentication failed', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return res.error('Token expired', 'Please login again', 401);
    }
    return res.error(error.message, 'Authentication error', 500);
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.error('Authentication required', 'Access denied', 401);
    }

    const expanded = new Set(Array.isArray(roles) ? roles : []);
    if (expanded.has('org_admin')) expanded.add('organization_admin');
    if (expanded.has('organization_admin')) expanded.add('org_admin');

    if (!expanded.has(req.user.role)) {
      return res.error('Insufficient permissions', 'Access denied', 403);
    }

    next();
  };
};

// Enhanced organization access middleware
const orgAccessMiddleware = (req, res, next) => {
  // Super admin can access everything
  if (req.user.role === 'superAdmin' || req.user.role === 'platform_admin' || req.user.role === 'platformAdmin') {
    req.canAccessAllOrganizations = true;
    return next();
  }

  // Platform admin and platform staff can access all organizations
  if (req.user.role === 'platformAdmin' || req.user.role === 'platform_admin' || req.user.role === 'platform_staff') {
    req.canAccessAllOrganizations = true;
    return next();
  }

  // Students without organization can browse all courses
  if (req.user.role === 'student' && !req.user.organization_id) {
    req.canAccessAllCourses = true;
    return next();
  }

  // Users with organization access their org data
  if (req.user.organization_id) {
    req.organizationFilter = { organization_id: req.user.organization_id };
    req.userOrganizationId = req.user.organization_id;
  }

  // Students can also access courses from organizations they're enrolled in
  if (req.user.role === 'student' && req.user.enrolledOrganizations?.length > 0) {
    req.enrolledOrganizations = req.user.enrolledOrganizations.map(e => e.organizationId);
  }

  next();
};

/**
 * Middleware to require organization admin role
 */
const requireOrgAdmin = (req, res, next) => {
  if (!req.user) {
    return res.error('Authentication required', 'Access denied', 401);
  }

  if (req.user.role !== 'organization_admin' && req.user.role !== 'org_admin') {
    return res.error('Organization admin access required', 'Access denied', 403);
  }

  next();
};

/**
 * Middleware to require instructor role
 */
const requireInstructor = (req, res, next) => {
  if (!req.user) {
    return res.error('Authentication required', 'Access denied', 401);
  }

  if (req.user.role !== 'instructor') {
    return res.error('Instructor access required', 'Access denied', 403);
  }

  next();
};

/**
 * Middleware to require student role
 */
const requireStudent = (req, res, next) => {
  if (!req.user) {
    return res.error('Authentication required', 'Access denied', 401);
  }

  if (req.user.role !== 'student') {
    return res.error('Student access required', 'Access denied', 403);
  }

  next();
};

// Parent access middleware for linked students
const parentAccessMiddleware = (req, res, next) => {
  if (req.user.role === 'parent') {
    req.linkedStudents = req.user.linkedStudents || [];
    req.accessibleOrganizations = req.linkedStudents.map(link => link.organizationId);
  }
  next();
};

// Permission-based middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.error('Authentication required', 'Access denied', 401);
    }

    // Super admin has all permissions
    if (req.user.role === 'superAdmin' || req.user.role === 'platform_admin' || req.user.role === 'platformAdmin') {
      return next();
    }

    if (!req.user.hasPermission(permission)) {
      return res.error('Insufficient permissions', 'You do not have permission to perform this action', 403);
    }

    next();
  };
};

// Multi-tenant data isolation middleware
const multiTenantMiddleware = (req, res, next) => {
  // Super admin, platform admin, and platform staff can access all data
  if (req.user.role === 'superAdmin' || req.user.role === 'platformAdmin' || req.user.role === 'platform_admin' || req.user.role === 'platform_staff') {
    return next();
  }

  // Set organization filter for queries
  if (req.user.organization_id) {
    req.organizationFilter = { organization_id: req.user.organization_id };
  }

  // For students, include enrolled organizations
  if (req.user.role === 'student') {
    const accessibleOrgs = [req.user.organization_id];
    if (req.user.enrolledOrganizations?.length > 0) {
      accessibleOrgs.push(...req.user.enrolledOrganizations.map(e => e.organizationId));
    }
    req.accessibleOrganizations = accessibleOrgs.filter(Boolean);
  }

  // For parents, include linked student organizations
  if (req.user.role === 'parent' && req.user.linkedStudents?.length > 0) {
    req.accessibleOrganizations = req.user.linkedStudents.map(link => link.organizationId);
  }

  next();
};

// Optional auth middleware for public routes
const optionalAuth = async (req, res, next) => {
  try {
    // Try to get token from Authorization header first, then fall back to cookies
    let token = null;

    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }

    // Fall back to cookie if no Authorization header
    if (!token) {
      token = req.cookies.token || req.cookies.instatute_token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId || decoded.user_id || decoded.id || decoded._id || decoded.sub;
      const user = await User.findById(userId).select('-password').populate('organization_id');

      if (user && user.isActive) {
        req.user = user;
        // Attach modulesEnabled for moduleGuard middleware
        if (user.organization_id && user.organization_id.modulesEnabled) {
          req.user.modulesEnabled = user.organization_id.modulesEnabled;
        }
      }
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

/**
 * Middleware to require platform admin role
 * Rejects all non-platform-admin users with 403
 */
const requirePlatformAdmin = (req, res, next) => {
  if (!req.user) {
    return res.error('Authentication required', 'Access denied', 401);
  }

  if (req.user.role !== 'platform_admin' && req.user.role !== 'platformAdmin') {
    return res.error('Platform admin access required', 'Access denied', 403);
  }

  next();
};

/**
 * Middleware to require platform-level access (admin OR staff)
 * Used for shared routes like viewing orgs, applications, analytics
 */
const requirePlatformStaff = (req, res, next) => {
  if (!req.user) {
    return res.error('Authentication required', 'Access denied', 401);
  }

  const platformRoles = ['platform_admin', 'platformAdmin', 'platform_staff'];
  if (!platformRoles.includes(req.user.role)) {
    return res.error('Platform access required', 'Access denied', 403);
  }

  next();
};

module.exports = {
  authMiddleware,
  requireRole,
  requirePermission,
  requirePlatformAdmin,
  requirePlatformStaff,
  requireOrgAdmin,
  requireInstructor,
  requireStudent,
  orgAccessMiddleware,
  parentAccessMiddleware,
  multiTenantMiddleware,
  optionalAuth
};
