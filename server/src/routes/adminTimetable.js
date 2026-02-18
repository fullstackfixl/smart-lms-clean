const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const AdminTimetableController = require('../controllers/AdminTimetableController');

// Define routes
router.use(authMiddleware, requireRole(['org_admin']));

router.post('/', AdminTimetableController.createTimetableEntry);
router.get('/', AdminTimetableController.getTimetable);
router.post('/conflicts', AdminTimetableController.checkConflicts); // Changed to POST to send complex body data easily
router.get('/conflicts', AdminTimetableController.checkConflicts); // Allow GET with query params if needed, but body is preferred for multiple checks
router.post('/assign', AdminTimetableController.assignResources);

module.exports = router;
