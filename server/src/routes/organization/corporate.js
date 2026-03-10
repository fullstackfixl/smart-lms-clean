const express = require('express');
const router = express.Router();
const corporateController = require('../../controllers/organization/corporateController');
const { assignTrainingValidator, createSkillValidator } = require('../../validators/organization/featureValidator');
const validate = require('../../middleware/validate');
const { authMiddleware, requireRole } = require('../../middleware/auth');

router.use(authMiddleware);

// Company Departments (Oversight)
router.get('/company-departments', requireRole(['org_admin']), corporateController.getCompanyDepartments);

// Training Assignments
router.post('/training-assignments', requireRole(['org_admin']), assignTrainingValidator, validate, corporateController.assignTraining);
router.get('/training-progress', requireRole(['org_admin', 'instructor']), async (req, res) => {
  const { TrainingAssignment } = require('../../models');
  const progress = await TrainingAssignment.find({ organization_id: req.user.organization_id }).populate('employee_id', 'name').populate('course_id', 'title');
  res.status(200).json({ success: true, data: progress });
});

// Skills - Fixed: replaced authorize with requireRole
router.get('/skills', requireRole(['org_admin', 'instructor', 'student']), corporateController.getSkills);
router.post('/skills', requireRole(['org_admin']), createSkillValidator, validate, corporateController.createSkill);

module.exports = router;
