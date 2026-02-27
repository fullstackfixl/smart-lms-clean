const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const AdminFeesController = require('../controllers/AdminFeesController');

const moduleGuard = require('../middleware/moduleGuard');

// Define routes
router.use(authMiddleware, requireRole(['org_admin']), moduleGuard('COURSE_SALES'));

router.post('/set', AdminFeesController.setFee);
router.get('/pending', AdminFeesController.getPendingFees);
router.get('/history', AdminFeesController.getFeeHistory);
router.post('/reminder', AdminFeesController.sendReminder);
router.get('/revenue', AdminFeesController.getRevenue);

module.exports = router;
