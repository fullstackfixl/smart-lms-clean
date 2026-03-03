const { ForbiddenError } = require('../core/errors');

/**
 * Middleware to ensure the user belongs to an organization.
 * Public students (organization_id = null) will be blocked.
 */
const requireOrganization = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!req.user.organization_id) {
        console.warn(`🔒 [Security] Access denied for public_student (${req.user.email}) to org route: ${req.originalUrl}`);
        return res.status(403).json({
            success: false,
            message: 'Access denied. This area requires an organization account.',
            code: 'ORG_REQUIRED'
        });
    }

    next();
};

module.exports = requireOrganization;
