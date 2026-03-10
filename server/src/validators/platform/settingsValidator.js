const { body } = require('express-validator');

exports.updatePlatformSettingsValidator = [
  body('platformName').optional().trim().notEmpty().withMessage('Platform name cannot be empty'),
  body('supportEmail').optional().isEmail().withMessage('Valid support email is required'),
  body('maintenanceMode').optional().isBoolean().withMessage('Maintenance mode must be a boolean'),
  body('maxOrganizations').optional().isInt({ min: 1 }).withMessage('maxOrganizations must be a positive integer'),
  body('defaultPlan').optional().isIn(['free', 'basic', 'premium', 'pro', 'enterprise']).withMessage('Invalid plan')
];
