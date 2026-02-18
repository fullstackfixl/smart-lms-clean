const express = require('express');
const enrollmentController = require('../../controllers/enrollmentController');
const { authMiddleware } = require('../../middleware/auth');
const { enforceOrgIsolation } = require('../../middleware/orgIsolation');

const router = express.Router();

router.post('/', 
  authMiddleware, 
  enforceOrgIsolation,
  enrollmentController.enrollInCourse
);

router.get('/', 
  authMiddleware, 
  enforceOrgIsolation,
  enrollmentController.getMyEnrollments
);

router.delete('/:id', 
  authMiddleware, 
  enforceOrgIsolation,
  enrollmentController.unenroll
);

module.exports = router;
