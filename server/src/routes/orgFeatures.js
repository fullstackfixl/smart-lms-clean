const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const departmentController = require('../controllers/organization/departmentController');
const semesterController = require('../controllers/organization/semesterController');
const programController = require('../controllers/organization/programController');
const schoolController = require('../controllers/organization/schoolController');
const homeworkController = require('../controllers/organization/homeworkController');
const instituteController = require('../controllers/organization/instituteController');
const corporateController = require('../controllers/organization/corporateController');

// Keep existing ones that we haven't replaced yet
const batchController = require('../controllers/BatchController');
const academicYearController = require('../controllers/AcademicYearController');
const SubjectController = require('../controllers/SubjectController');
const TestSeriesController = require('../controllers/TestSeriesController');
const SchoolGradeController = require('../controllers/SchoolGradeController');
const GPAReportController = require('../controllers/GPAReportController');
const TrainerController = require('../controllers/TrainerController');
const LeaderboardController = require('../controllers/LeaderboardController');
const AcademicEnrollmentController = require('../controllers/AcademicEnrollmentController');
const { createDepartmentValidator, createSemesterValidator, createProgramValidator, createHomeworkValidator, createBatchValidator, assignTrainingValidator, createSkillValidator } = require('../validators/organization/featureValidator');
const validate = require('../middleware/validate');
const moduleGuard = require('../middleware/moduleGuard');

// All routes require authentication and organization admin role
router.use(authMiddleware, requireRole(['org_admin']));

// Academic Year Routes
router.get('/academic-years', moduleGuard('ACADEMIC_YEAR'), academicYearController.getAll);
router.post('/academic-years', moduleGuard('ACADEMIC_YEAR'), academicYearController.create);
router.get('/academic-years/:id', moduleGuard('ACADEMIC_YEAR'), academicYearController.getById);
router.put('/academic-years/:id', moduleGuard('ACADEMIC_YEAR'), academicYearController.update);
router.delete('/academic-years/:id', moduleGuard('ACADEMIC_YEAR'), academicYearController.delete);

// Department Routes
router.get('/departments', moduleGuard('DEPARTMENTS'), departmentController.getDepartments);
router.post('/departments', moduleGuard('DEPARTMENTS'), createDepartmentValidator, validate, departmentController.createDepartment);
router.get('/departments/:id', moduleGuard('DEPARTMENTS'), departmentController.getDepartmentById);
router.put('/departments/:id', moduleGuard('DEPARTMENTS'), departmentController.updateDepartment);
router.delete('/departments/:id', moduleGuard('DEPARTMENTS'), departmentController.deleteDepartment);

// Academic Program (Academic Course) Routes
router.get('/courses', moduleGuard('DEPARTMENTS'), programController.getPrograms);
router.post('/courses', moduleGuard('DEPARTMENTS'), createProgramValidator, validate, programController.createProgram);
router.get('/courses/:id', moduleGuard('DEPARTMENTS'), programController.getProgramById); 
router.put('/courses/:id', moduleGuard('DEPARTMENTS'), programController.updateProgram);
router.delete('/courses/:id', moduleGuard('DEPARTMENTS'), programController.deleteProgram);

// Batch Routes
router.get('/batches', moduleGuard('BATCHES'), batchController.getAll);
router.post('/batches', moduleGuard('BATCHES'), batchController.create);
router.get('/batches/:id', moduleGuard('BATCHES'), batchController.getById);
router.put('/batches/:id', moduleGuard('BATCHES'), batchController.update);
router.delete('/batches/:id', moduleGuard('BATCHES'), batchController.delete);

// Semester Routes
router.get('/semesters', moduleGuard('SEMESTERS'), semesterController.getSemesters);
router.post('/semesters', moduleGuard('SEMESTERS'), createSemesterValidator, validate, semesterController.createSemester);
router.get('/semesters/:id', moduleGuard('SEMESTERS'), semesterController.getSemesterById);
router.put('/semesters/:id', moduleGuard('SEMESTERS'), semesterController.updateSemester);
router.delete('/semesters/:id', moduleGuard('SEMESTERS'), semesterController.deleteSemester);

// Subject Routes
router.get('/subjects', moduleGuard('SUBJECTS'), SubjectController.getAll);
router.post('/subjects', moduleGuard('SUBJECTS'), SubjectController.create);
router.get('/subjects/:id', moduleGuard('SUBJECTS'), SubjectController.getById);
router.put('/subjects/:id', moduleGuard('SUBJECTS'), SubjectController.update);
router.delete('/subjects/:id', moduleGuard('SUBJECTS'), SubjectController.delete);

// Test Series Routes
router.use('/test-series', moduleGuard('TEST_SERIES'));
router.get('/test-series', (req, res) => TestSeriesController.list(req, res));
router.post('/test-series', (req, res) => TestSeriesController.create(req, res));
router.put('/test-series/:id', (req, res) => TestSeriesController.update(req, res));
router.delete('/test-series/:id', (req, res) => TestSeriesController.delete(req, res));

// School Grade Levels & Sections (Mapping to new Controller)
router.get('/school-levels', moduleGuard('GRADES_SECTIONS'), schoolController.getClasses);
router.post('/school-levels', moduleGuard('GRADES_SECTIONS'), schoolController.createClass);
router.get('/school-sections', moduleGuard('GRADES_SECTIONS'), schoolController.getSections);
router.post('/school-sections', moduleGuard('GRADES_SECTIONS'), schoolController.createSection);

// Homework (School)
router.get('/homework', moduleGuard('GRADES_SECTIONS'), homeworkController.getHomework);
router.post('/homework', moduleGuard('GRADES_SECTIONS'), createHomeworkValidator, validate, homeworkController.createHomework);

// Parent Access (School)
router.get('/parents', moduleGuard('GRADES_SECTIONS'), async (req, res) => {
  const { User } = require('../models');
  const parents = await User.find({ organization_id: req.user.organization_id, role: 'parent' });
  res.status(200).json({ success: true, data: parents });
});

// GPA Reports (College)
router.use('/gpa', moduleGuard('GPA_REPORTS'));
router.get('/gpa/stats', (req, res) => GPAReportController.getOrganizationGPA(req, res));
router.get('/gpa/at-risk', (req, res) => GPAReportController.getAtRiskStudents(req, res));
router.get('/gpa/departments', (req, res) => GPAReportController.getDepartmentWiseGPA(req, res));
router.get('/gpa/student/:studentId', (req, res) => GPAReportController.getStudentGPA(req, res));

// Trainers (Institute)
router.use('/trainers', moduleGuard('TRAINERS'));
router.get('/trainers', (req, res) => TrainerController.list(req, res));
router.put('/trainers/:id/expertise', (req, res) => TrainerController.updateExpertise(req, res));

// Institute Features (Batches & Certificates)
router.get('/batches', moduleGuard('BATCHES'), instituteController.getBatches);
router.post('/batches', moduleGuard('BATCHES'), createBatchValidator, validate, instituteController.createBatch);
router.post('/certificates', moduleGuard('CERTIFICATES'), instituteController.issueCertificate);

// Corporate Features
router.get('/company-departments', moduleGuard('DEPARTMENTS'), corporateController.getCompanyDepartments);
router.post('/training-assignments', moduleGuard('DEPARTMENTS'), assignTrainingValidator, validate, corporateController.assignTraining);
router.get('/skills', moduleGuard('DEPARTMENTS'), corporateController.getSkills);
router.post('/skills', moduleGuard('DEPARTMENTS'), createSkillValidator, validate, corporateController.createSkill);

// Leaderboards (Institute)
router.use('/leaderboard', moduleGuard('LEADERBOARDS'));
router.get('/leaderboard', (req, res) => LeaderboardController.getGlobalLeaderboard(req, res));
router.get('/leaderboard/badges/:userId', (req, res) => LeaderboardController.getUserBadges(req, res));

// Academic Enrollment Routes
router.post('/enrollments/program', moduleGuard('DEPARTMENTS'), (req, res) => AcademicEnrollmentController.enrollInProgram(req, res));
router.get('/enrollments/student/:studentId', moduleGuard('DEPARTMENTS'), (req, res) => AcademicEnrollmentController.getStudentAcademicProfile(req, res));

module.exports = router;
