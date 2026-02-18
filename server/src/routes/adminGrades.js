const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const AdminGradeController = require('../controllers/AdminGradeController');

// Define routes
router.use(authMiddleware, requireRole(['org_admin']));

router.get('/', AdminGradeController.getGrades);
router.get('/course/:id', AdminGradeController.getCourseGrades);
router.post('/export', AdminGradeController.exportGrades);
router.get('/audit', AdminGradeController.auditGrades);

module.exports = router;
