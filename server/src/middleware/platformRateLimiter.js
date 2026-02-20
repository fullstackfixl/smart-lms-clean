// Rate limiting DISABLED - no-op pass-through middleware

const noopMiddleware = (req, res, next) => next();

const platformAdminLimiter = noopMiddleware;
const platformAdminStrictLimiter = noopMiddleware;
const organizationCreationLimiter = noopMiddleware;

module.exports = {
  platformAdminLimiter,
  platformAdminStrictLimiter,
  organizationCreationLimiter
};
