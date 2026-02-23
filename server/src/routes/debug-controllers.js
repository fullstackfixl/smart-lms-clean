try {
    console.log('--- Debugging Controllers ---');

    const controllers = [
        '../controllers/PlatformApplicationController',
        '../controllers/PlatformAnalyticsController',
        '../controllers/PlatformOrganizationController',
        '../controllers/PlatformAdminsController',
        '../controllers/platformController'
    ];

    controllers.forEach(path => {
        try {
            const ctrl = require(path);
            console.log(`✅ Required ${path}`);
            console.log(`   Methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(ctrl)).filter(n => n !== 'constructor')}`);
        } catch (e) {
            console.error(`❌ Failed to require ${path}: ${e.message}`);
        }
    });

    console.log('\n--- Checking specific methods ---');
    const platformController = require('../controllers/platformController');
    console.log('platformController.createSuperAdmin:', typeof platformController.createSuperAdmin);

    const platformAdminsController = require('../controllers/PlatformAdminsController');
    console.log('platformAdminsController.getAll:', typeof platformAdminsController.getAll);

} catch (globalError) {
    console.error('GLOBAL ERROR:', globalError);
}
