const { AuthorizationError } = require('../core/errors');

const enforceOrgIsolation = (req, res, next) => {
  if (!req.user) {
    return next(new AuthorizationError('Authentication required'));
  }

  if (req.user.role === 'platform_admin' || req.user.role === 'superAdmin') {
    req.bypassOrgIsolation = true;
    return next();
  }

  if (req.user.organization_id) {
    req.orgContext = {
      organization_id: req.user.organization_id,
      canAccessAllOrgs: false
    };
  }

  next();
};

const bypassOrgIsolation = (req, res, next) => {
  req.bypassOrgIsolation = true;
  next();
};

module.exports = {
  enforceOrgIsolation,
  bypassOrgIsolation
};
