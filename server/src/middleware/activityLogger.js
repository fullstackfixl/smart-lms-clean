const AdminLog = require('../models/AdminLog');

/**
 * Middleware to log platform staff/admin actions.
 * Attach AFTER authMiddleware so req.user is available.
 * Only logs mutating requests (POST, PUT, PATCH, DELETE) for staff.
 * Logs ALL mutating requests for both admin and staff roles.
 */
const activityLogger = (req, res, next) => {
    // Only log authenticated platform users
    if (!req.user) return next();
    if (req.user.role !== 'platform_staff' && req.user.role !== 'platform_admin') return next();

    // Only log mutating methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

    // Capture original res.json to log after response is sent
    const originalJson = res.json.bind(res);
    res.json = function (body) {
        // Fire-and-forget log creation
        const targetId = req.params.id || req.body?.email || req.body?.name || null;
        AdminLog.create({
            userId: req.user._id,
            role: req.user.role,
            action: `${req.method} ${req.originalUrl || req.path}`,
            method: req.method,
            path: req.originalUrl || req.path,
            target: targetId ? String(targetId) : null,
            details: req.method === 'DELETE' ? null : (req.body ? { keys: Object.keys(req.body) } : null),
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null,
            statusCode: res.statusCode
        }).catch(err => console.error('⚠️ [ActivityLogger] Failed to log:', err.message));

        return originalJson(body);
    };

    next();
};

module.exports = { activityLogger };
