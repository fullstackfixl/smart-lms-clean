/**
 * Module Guard Middleware
 * Checks if the user's organization has the required module enabled.
 * Usage: router.use(moduleGuard('ATTENDANCE'))
 */
function getOrganizationControlState(user) {
    const organization = user?.organization_id;
    return organization?.platformControls || organization?.settings?.platformControls || {};
}

function isExplicitlyDisabled(controlState, requiredModule, method) {
    const permissions = controlState.permissions || {};
    const features = controlState.features || {};
    const finance = controlState.finance || {};
    const marketplace = controlState.marketplace || {};

    switch (String(requiredModule).toUpperCase()) {
        case 'COURSES':
            return method !== 'GET' && permissions.canCreateCourses === false;
        case 'STAFF':
        case 'INSTRUCTORS':
            return method !== 'GET' && permissions.canCreateInstructors === false;
        case 'FEES':
            return method === 'GET'
                ? permissions.canViewFinancials === false || finance.canViewFinancials === false
                : finance.canEditFees === false;
        case 'MARKETPLACE':
            return permissions.canAccessMarketplace === false || marketplace.enabled === false || features.marketplace === false;
        case 'CHAT':
            return permissions.canManageChat === false || features.chat === false;
        case 'ATTENDANCE':
            return permissions.canManageAttendance === false;
        case 'LIVE_CLASSES':
            return features.liveClasses === false;
        default:
            return false;
    }
}

const moduleGuard = (requiredModule) => {
    return (req, res, next) => {
        // Platform admins bypass module checks
        if (req.user && (req.user.role === 'platform_admin' || req.user.role === 'superAdmin')) {
            return next();
        }

        const controlState = getOrganizationControlState(req.user);
        const requiredModules = Array.isArray(requiredModule) ? requiredModule : [requiredModule];
        if (requiredModules.some((mod) => isExplicitlyDisabled(controlState, mod, req.method))) {
            return res.status(403).json({
                success: false,
                message: `One of the required modules [${requiredModules.join(', ')}] is disabled by platform policy.`
            });
        }

        const modulesEnabled = req.user?.modulesEnabled || [];
        if (!Array.isArray(modulesEnabled) || modulesEnabled.length === 0) {
            return next();
        }

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
