const express = require('express');
const router = express.Router();
const StudentRegistrationController = require('../controllers/StudentRegistrationController');

// CSRF is disabled for these routes in middleware/csrf.js
router.post('/validate-organization', (req, res) => StudentRegistrationController.validateOrganization(req, res));
router.post('/send-verification', (req, res) => StudentRegistrationController.sendVerification(req, res));
router.post('/complete-registration', (req, res) => StudentRegistrationController.completeRegistration(req, res));

module.exports = router;
