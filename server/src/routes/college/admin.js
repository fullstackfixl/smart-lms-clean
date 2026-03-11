const express = require('express');
const router = express.Router();
const multer = require('multer');

const adminController = require('../../controllers/college/collegeAdminController');
const { verifyJWT, checkRole, checkOrganization } = require('../../middleware/collegeTenant');

router.use(verifyJWT, checkOrganization, checkRole(['org_admin']));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/dashboard', adminController.getDashboard);

router.post('/instructors', adminController.createInstructor);
router.get('/instructors', adminController.listInstructors);
router.get('/instructors/:id', adminController.getInstructor);
router.put('/instructors/:id', adminController.updateInstructor);
router.delete('/instructors/:id', adminController.deleteInstructor);

router.post('/students', adminController.createStudent);
router.post('/students/import', upload.single('file'), adminController.importStudents);
router.get('/students', adminController.listStudents);
router.get('/students/:id', adminController.getStudent);
router.patch('/students/:id/suspend', adminController.suspendStudent);

router.post('/enrollments', adminController.enrollStudent);

router.post('/courses', adminController.createCourse);
router.get('/courses', adminController.listCourses);
router.get('/courses/:id', adminController.getCourse);
router.patch('/courses/:id/assign', adminController.assignInstructor);

router.get('/analytics', adminController.getAnalytics);

module.exports = router;
