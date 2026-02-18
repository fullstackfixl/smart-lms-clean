const User = require('../models/User');
const Organization = require('../models/Organization');

/**
 * Middleware to validate that instructors can only access their own institute's pages
 * Validates that the instructor's organization matches the requested organization
 */
const requireInstituteAccess = async (req, res, next) => {
  try {
    // Check if user is authenticated and is an instructor
    if (!req.user || req.user.role !== 'instructor') {
      return res.error('Access denied. Instructors only.', 'Unauthorized', 403);
    }

    // Get the organization_id from the request parameters, query, or body
    const organizationId = req.params.organizationId ||
      req.params.id ||
      req.query.organizationId ||
      req.body.organization_id;

    if (!organizationId) {
      return res.error('Organization ID is required', 'Bad Request', 400);
    }

    // Get the full user data with organization
    const user = await User.findById(req.user.userId).populate('organization_id');
    
    if (!user) {
      return res.error('User not found', 'Unauthorized', 401);
    }

    if (!user.organization_id) {
      return res.error('User organization not found', 'Unauthorized', 403);
    }

    // Check if the user's organization matches the requested organization
    if (user.organization_id._id.toString() !== organizationId.toString()) {
      return res.error(
        'Access denied. You can only access your own institute\'s pages.',
        'Unauthorized',
        403
      );
    }

    // Add organization to request object for use in downstream middleware/routes
    req.organization = user.organization_id;

    next();
  } catch (error) {
    console.error('Institute access validation error:', error);
    return res.error('Internal server error during access validation', 'Server Error', 500);
  }
};

/**
 * Middleware to validate that users can only access resources from their own organization
 * More general version for any organization-specific resource
 */
const requireOrganizationAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.error('Authentication required', 'Unauthorized', 401);
    }

    // Get organization_id from various sources
    const organizationId = req.params.organizationId ||
      req.params.id ||
      req.query.organizationId ||
      req.body.organization_id;

    if (!organizationId) {
      return res.error('Organization ID is required', 'Bad Request', 400);
    }

    // Get user with organization
    const user = await User.findById(req.user.userId).populate('organization_id');

    if (!user) {
      return res.error('User not found', 'Unauthorized', 401);
    }

    // For public students, organization_id should be null
    if (user.role === 'public_student') {
      return res.error('Public students cannot access organization resources', 'Forbidden', 403);
    }

    // Check organization access
    if (!user.organization_id || user.organization_id._id.toString() !== organizationId.toString()) {
      return res.error(
        'Access denied. You can only access resources from your own organization.',
        'Unauthorized',
        403
      );
    }

    // Add organization to request object
    req.organization = user.organization_id;

    next();
  } catch (error) {
    console.error('Organization access validation error:', error);
    return res.error('Internal server error during access validation', 'Server Error', 500);
  }
};

/**
 * Middleware to validate email domain for instructor actions
 * Ensures instructor's email domain matches their organization's approved domains
 */
const validateInstructorEmailDomain = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'instructor') {
      return next(); // Skip validation for non-instructors
    }

    const user = await User.findById(req.user.userId).populate('organization_id');

    if (!user || !user.organization_id) {
      return res.error('Instructor organization not found', 'Unauthorized', 403);
    }

    const emailDomain = user.email.split('@')[1].toLowerCase();

    // Validate that instructor's email domain is still in the organization's approved domains
    if (!user.organization_id.emailDomains.includes(emailDomain)) {
      return res.error(
        `Your email domain (${emailDomain}) is no longer approved for your organization. Please contact your administrator.`,
        'Email domain validation failed',
        403
      );
    }

    next();
  } catch (error) {
    console.error('Email domain validation error:', error);
    return res.error('Internal server error during email validation', 'Server Error', 500);
  }
};

/**
 * Middleware to check if user has verified email (for organization users)
 */
const requireEmailVerification = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.error('Authentication required', 'Unauthorized', 401);
    }

    // Public students don't need email verification
    if (req.user.role === 'public_student') {
      return next();
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.error('User not found', 'Unauthorized', 401);
    }

    // Check if email is verified for organization users
    if (!user.email_verified) {
      return res.error(
        'Email verification required. Please verify your email address.',
        'Email not verified',
        403
      );
    }

    next();
  } catch (error) {
    console.error('Email verification check error:', error);
    return res.error('Internal server error during verification check', 'Server Error', 500);
  }
};

module.exports = {
  requireInstituteAccess,
  requireOrganizationAccess,
  validateInstructorEmailDomain,
  requireEmailVerification
};