const { body, param } = require('express-validator');

exports.createStaffValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array')
];

exports.updateStaffValidator = [
  param('staffId').isMongoId().withMessage('Invalid staff ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array')
];
