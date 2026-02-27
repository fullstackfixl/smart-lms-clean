const express = require('express');
const parentController = require('../controllers/parentController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const tenantIsolation = require('../middleware/tenantIsolation');
const moduleGuard = require('../middleware/moduleGuard');
const router = express.Router();

// Apply module guard to all parent routes
router.use(authMiddleware, moduleGuard('PARENT_PORTAL'));

// Student: Generate linking code
router.post('/generate-code', authMiddleware, requireRole(['student']), parentController.generateCode);

// Parent: Link child using code
router.post('/link-child', authMiddleware, requireRole(['parent']), tenantIsolation, parentController.linkChildByCode);

// Parent: Get linked children
router.get('/children', authMiddleware, requireRole(['parent']), tenantIsolation, parentController.getLinkedChildren);

// Student progress, grades, etc. (Can be added here using parentAccess middleware)
router.get('/student/:student_id/progress', authMiddleware, requireRole(['parent']), tenantIsolation, parentController.getChildProgress);

module.exports = router;