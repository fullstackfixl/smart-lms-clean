const express = require('express');
const router = express.Router();
const programController = require('../../controllers/organization/programController');
const departmentController = require('../../controllers/organization/departmentController');
const semesterController = require('../../controllers/organization/semesterController');
const { createDepartmentValidator, createSemesterValidator, createProgramValidator } = require('../../validators/organization/featureValidator');
const validate = require('../../middleware/validate');
const { authMiddleware, requireRole } = require('../../middleware/auth');


router.use(authMiddleware);
router.use(requireRole(['org_admin', 'instructor']));


// Departments
router.get('/departments', departmentController.getDepartments);
router.post('/departments', createDepartmentValidator, validate, departmentController.createDepartment);
router.put('/departments/:id', departmentController.updateDepartment);
router.delete('/departments/:id', departmentController.deleteDepartment);

// Semesters
router.get('/semesters', semesterController.getSemesters);
router.post('/semesters', createSemesterValidator, validate, semesterController.createSemester);

// Programs
router.get('/programs', programController.getPrograms);
router.post('/programs', createProgramValidator, validate, programController.createProgram);

module.exports = router;
