try {
    const liveClassController = require('../controllers/liveClassController');
    console.log('liveClassController keys:', Object.keys(liveClassController));
    console.log('scheduleClass type:', typeof liveClassController.scheduleClass);
    console.log('getInstructorClasses type:', typeof liveClassController.getInstructorClasses);
} catch (e) {
    console.error(e);
}
