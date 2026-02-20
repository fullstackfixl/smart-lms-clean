// Rate limiting DISABLED - no-op pass-through middleware

const noopMiddleware = (req, res, next) => next();

const authLimiter = noopMiddleware;
const otpLimiter = noopMiddleware;

module.exports = {
    authLimiter,
    otpLimiter
};
