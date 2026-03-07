const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const departmentController = require('../controllers/DepartmentController');
const batchController = require('../controllers/BatchController');
const academicYearController = require('../controllers/AcademicYearController');
const semesterController = require('../controllers/SemesterController');
const SubjectController = require('../controllers/SubjectController');
const TestSeriesController = require('../controllers/TestSeriesController');
const SchoolGradeController = require('../controllers/SchoolGradeController');
const GPAReportController = require('../controllers/GPAReportController');
const TrainerController = require('../controllers/TrainerController');
const LeaderboardController = require('../controllers/LeaderboardController');
const ProgramController = require('../controllers/ProgramController');
const AcademicEnrollmentController = require('../controllers/AcademicEnrollmentController');
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
router.get('/departments', moduleGuard('DEPARTMENTS'), departmentController.getAll);
router.post('/departments', moduleGuard('DEPARTMENTS'), departmentController.create);
router.get('/departments/:id', moduleGuard('DEPARTMENTS'), departmentController.getById);
router.put('/departments/:id', moduleGuard('DEPARTMENTS'), departmentController.update);
router.delete('/departments/:id', moduleGuard('DEPARTMENTS'), departmentController.delete);

// Academic Program (Academic Course) Routes
router.get('/courses', moduleGuard('DEPARTMENTS'), ProgramController.getAll);
router.post('/courses', moduleGuard('DEPARTMENTS'), ProgramController.create);
router.get('/courses/:id', moduleGuard('DEPARTMENTS'), ProgramController.getById);
router.put('/courses/:id', moduleGuard('DEPARTMENTS'), ProgramController.update);
router.delete('/courses/:id', moduleGuard('DEPARTMENTS'), ProgramController.delete);

// Batch Routes
router.get('/batches', moduleGuard('BATCHES'), batchController.getAll);
router.post('/batches', moduleGuard('BATCHES'), batchController.create);
router.get('/batches/:id', moduleGuard('BATCHES'), batchController.getById);
router.put('/batches/:id', moduleGuard('BATCHES'), batchController.update);
router.delete('/batches/:id', moduleGuard('BATCHES'), batchController.delete);

// Semester Routes
router.get('/semesters', moduleGuard('SEMESTERS'), semesterController.getAll);
router.post('/semesters', moduleGuard('SEMESTERS'), semesterController.create);
router.get('/semesters/:id', moduleGuard('SEMESTERS'), semesterController.getById);
router.put('/semesters/:id', moduleGuard('SEMESTERS'), semesterController.update);
router.delete('/semesters/:id', moduleGuard('SEMESTERS'), semesterController.delete);

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

// School Grade Levels & Sections
router.use(['/school-levels', '/school-sections'], moduleGuard('GRADES_SECTIONS'));
router.get('/school-levels', (req, res) => SchoolGradeController.listLevels(req, res));
router.post('/school-levels', (req, res) => SchoolGradeController.createLevel(req, res));
router.put('/school-levels/:id', (req, res) => SchoolGradeController.updateLevel(req, res));
router.delete('/school-levels/:id', (req, res) => SchoolGradeController.deleteLevel(req, res));
router.get('/school-sections', (req, res) => SchoolGradeController.listSections(req, res));
router.post('/school-sections', (req, res) => SchoolGradeController.createSection(req, res));
router.put('/school-sections/:id', (req, res) => SchoolGradeController.updateSection(req, res));
router.delete('/school-sections/:id', (req, res) => SchoolGradeController.deleteSection(req, res));

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

// Leaderboards (Institute)
router.use('/leaderboard', moduleGuard('LEADERBOARDS'));
router.get('/leaderboard', (req, res) => LeaderboardController.getGlobalLeaderboard(req, res));
router.get('/leaderboard/badges/:userId', (req, res) => LeaderboardController.getUserBadges(req, res));

// Academic Enrollment Routes
router.post('/enrollments/program', moduleGuard('DEPARTMENTS'), (req, res) => AcademicEnrollmentController.enrollInProgram(req, res));
router.get('/enrollments/student/:studentId', moduleGuard('DEPARTMENTS'), (req, res) => AcademicEnrollmentController.getStudentAcademicProfile(req, res));

module.exports = router;
