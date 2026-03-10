const express = require('express');
const router = express.Router();
const schoolController = require('../../controllers/organization/schoolController');
const homeworkController = require('../../controllers/organization/homeworkController');
const { createHomeworkValidator } = require('../../validators/organization/featureValidator');
const validate = require('../../middleware/validate');
const { authMiddleware, requireRole } = require('../../middleware/auth');


router.use(authMiddleware);

// Classes & Sections (Admin/Instructor)
router.get('/classes', requireRole(['org_admin', 'instructor']), schoolController.getClasses);
router.post('/classes', requireRole(['org_admin']), schoolController.createClass);
router.get('/sections', requireRole(['org_admin', 'instructor']), schoolController.getSections);
router.post('/sections', requireRole(['org_admin']), schoolController.createSection);

// Homework (Instructor/Admin create, Student/Parent view)
router.get('/homework', requireRole(['org_admin', 'instructor', 'student', 'parent']), homeworkController.getHomework);
router.post('/homework', requireRole(['org_admin', 'instructor']), createHomeworkValidator, validate, homeworkController.createHomework);

// Parent Access (Admin manage)
router.get('/parents', requireRole(['org_admin']), async (req, res) => {
  const { User } = require('../../models');
  const parents = await User.find({ organization_id: req.user.organization_id, role: 'parent' }).populate('parent_link', 'name email');
  res.status(200).json({ success: true, data: parents });
});

module.exports = router;
