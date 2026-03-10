const { body, param } = require('express-validator');

exports.createOrganizationValidator = [
  body('name').trim().notEmpty().withMessage('Organization name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('type').isIn(['SCHOOL', 'COLLEGE', 'INSTITUTE', 'ONLINE_ACADEMY']).withMessage('Invalid organization type'),
  body('plan').optional().isIn(['free', 'basic', 'premium', 'pro', 'enterprise']).withMessage('Invalid plan'),
  body('maxStudents').optional().isInt({ min: 1 }).withMessage('maxStudents must be a positive integer'),
  body('maxInstructors').optional().isInt({ min: 1 }).withMessage('maxInstructors must be a positive integer'),
  body('subdomain').trim().notEmpty().withMessage('Subdomain is required').isLowercase().withMessage('Subdomain must be lowercase')
];

exports.updateOrganizationValidator = [
  param('orgId').isMongoId().withMessage('Invalid organization ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('status').optional().isIn(['active', 'suspended', 'pending']).withMessage('Invalid status'),
  body('plan').optional().isIn(['free', 'basic', 'premium', 'pro', 'enterprise']).withMessage('Invalid plan'),
  body('maxStudents').optional().isInt({ min: 1 }).withMessage('maxStudents must be a positive integer'),
  body('maxInstructors').optional().isInt({ min: 1 }).withMessage('maxInstructors must be a positive integer')
];
