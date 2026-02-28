/**
 * checkModuleAccess Middleware
 * Factory function to protect routes by required module name.
 * Usage: router.get('/attendance', checkModuleAccess('ATTENDANCE'), controller)
 *
 * Logic:
 *  - Platform admins always pass through
 *  - Org admins/instructors/students must have the module in org.modulesEnabled
 *  - If not enabled → 403 Forbidden
 */
const Organization = require('../models/Organization');

const checkModuleAccess = (moduleName) => {
    return async (req, res, next) => {
        try {
            // Platform admins and super admins bypass all module checks
            if (req.user && (req.user.role === 'platform_admin' || req.user.role === 'superAdmin')) {
                return next();
            }

            // Try from token-attached modulesEnabled (populated by auth middleware)
            let modulesEnabled = req.user?.modulesEnabled;

            // If not in token, fetch fresh from DB
            if (!modulesEnabled || modulesEnabled.length === 0) {
                const orgId = req.user?.organization_id?._id || req.user?.organization_id;
                if (!orgId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Organization not found in token. Cannot verify module access.'
                    });
                }
                const org = await Organization.findById(orgId).select('modulesEnabled').lean();
                modulesEnabled = org?.modulesEnabled || [];
            }

            const modules = Array.isArray(moduleName) ? moduleName : [moduleName];
            const hasAccess = modules.some(mod => modulesEnabled.includes(mod));

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: `Module '${moduleName}' is not enabled for your organization.`
                });
            }

            next();
        } catch (error) {
            console.error('[checkModuleAccess] Error:', error.message);
            res.status(500).json({ success: false, message: 'Failed to verify module access.' });
        }
    };
};

module.exports = checkModuleAccess;
