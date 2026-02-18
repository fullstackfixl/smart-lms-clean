const rateLimit = require('express-rate-limit');

// More lenient limits for development
const isDevelopment = process.env.NODE_ENV !== 'production';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 100 : 20, // 100 in dev, 20 in production
    message: {
        success: false,
        message: 'Too many accounts created or login attempts from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Don't skip successful requests
    skipFailedRequests: false, // Don't skip failed requests
});

const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isDevelopment ? 50 : 10, // 50 in dev, 10 in production
    message: {
        success: false,
        message: 'Too many OTP requests from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    otpLimiter
};
