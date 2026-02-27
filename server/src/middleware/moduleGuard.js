/**
 * Module Guard Middleware
 * Checks if the user's organization has the required module enabled.
 * Usage: router.use(moduleGuard('ATTENDANCE'))
 */
const moduleGuard = (requiredModule) => {
    return (req, res, next) => {
        // Platform admins bypass module checks
        if (req.user && (req.user.role === 'platform_admin' || req.user.role === 'superAdmin')) {
            return next();
        }

        const modulesEnabled = req.user?.modulesEnabled || [];
        const requiredModules = Array.isArray(requiredModule) ? requiredModule : [requiredModule];

        const hasAccess = requiredModules.some(mod => modulesEnabled.includes(mod));

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: `One of the required modules [${requiredModules.join(', ')}] is not enabled for your organization.`
            });
        }

        next();
    };
};

module.exports = moduleGuard;
