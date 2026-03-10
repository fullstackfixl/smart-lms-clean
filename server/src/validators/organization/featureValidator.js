const { body, param } = require('express-validator');

exports.createDepartmentValidator = [
  body('name').notEmpty().withMessage('Department name is required').trim(),
  body('code').notEmpty().withMessage('Department code is required').trim()
];

exports.createSemesterValidator = [
  body('name').notEmpty().withMessage('Semester name is required').trim(),
  body('number').isNumeric().withMessage('Semester number must be a number')
];

exports.createProgramValidator = [
  body('name').notEmpty().withMessage('Program name is required').trim(),
  body('code').notEmpty().withMessage('Program code is required').trim(),
  body('department_id').isMongoId().withMessage('Invalid department ID')
];

exports.createHomeworkValidator = [
  body('class_id').isMongoId().withMessage('Invalid class ID'),
  body('section_id').isMongoId().withMessage('Invalid section ID'),
  body('subject_id').isMongoId().withMessage('Invalid subject ID'),
  body('title').notEmpty().withMessage('Homework title is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required')
];

exports.createBatchValidator = [
  body('name').notEmpty().withMessage('Batch name is required'),
  body('code').notEmpty().withMessage('Batch code is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required')
];

exports.assignTrainingValidator = [
  body('employee_id').isMongoId().withMessage('Invalid employee ID'),
  body('course_id').isMongoId().withMessage('Invalid course ID')
];

exports.createSkillValidator = [
  body('name').notEmpty().withMessage('Skill name is required'),
  body('category').notEmpty().withMessage('Skill category is required')
];
