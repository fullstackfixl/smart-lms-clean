const { body } = require('express-validator');

exports.generateReportValidator = [
  body('type').isIn(['users', 'organizations', 'courses', 'enrollments']).withMessage('Invalid report type'),
  body('format').isIn(['CSV', 'PDF']).withMessage('Invalid report format'),
  body('filters').optional().isObject().withMessage('Filters must be an object')
];
