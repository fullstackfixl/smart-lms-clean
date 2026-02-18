const express = require('express');
const courseController = require('../../controllers/courseController');
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { enforceOrgIsolation } = require('../../middleware/orgIsolation');

const router = express.Router();

router.post('/', 
  authMiddleware, 
  requireRole(['teacher', 'admin']), 
  enforceOrgIsolation,
  courseController.createCourse
);

router.get('/', 
  courseController.getCourses
);

router.get('/:id', 
  courseController.getCourseById
);

router.put('/:id', 
  authMiddleware, 
  requireRole(['teacher', 'admin']), 
  enforceOrgIsolation,
  courseController.updateCourse
);

router.delete('/:id', 
  authMiddleware, 
  requireRole(['teacher', 'admin']), 
  enforceOrgIsolation,
  courseController.deleteCourse
);

router.post('/:id/publish', 
  authMiddleware, 
  requireRole(['teacher', 'admin']), 
  enforceOrgIsolation,
  courseController.publishCourse
);

module.exports = router;
