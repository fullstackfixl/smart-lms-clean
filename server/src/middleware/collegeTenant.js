const { Organization } = require('../models');
const { authMiddleware } = require('./auth');

const verifyJWT = authMiddleware;

const checkRole = (roles) => {
  const normalized = Array.isArray(roles) ? roles : [];
  const expanded = new Set(normalized);
  if (expanded.has('organization_admin')) expanded.add('org_admin');
  if (expanded.has('org_admin')) expanded.add('organization_admin');

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!expanded.has(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };
};

const checkOrganization = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.user.role === 'platform_admin' || req.user.role === 'platformAdmin' || req.user.role === 'platform_staff') {
      return next();
    }

    const userOrgId = req.user.organization_id?._id || req.user.organization_id;
    if (!userOrgId) {
      return res.status(403).json({ success: false, message: 'Organization affiliation required' });
    }

    if (req.params.organizationId && String(req.params.organizationId) !== String(userOrgId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const org = await Organization.findById(userOrgId).select('type is_deleted');
    if (!org || org.is_deleted) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    const orgType = String(org.type || '').toLowerCase();
    if (orgType !== 'college') {
      return res.status(403).json({ success: false, message: 'College tenant access required' });
    }

    req.collegeOrganizationId = userOrgId;
    req.collegeOrganizationType = 'college';

    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  verifyJWT,
  checkRole,
  checkOrganization
};
