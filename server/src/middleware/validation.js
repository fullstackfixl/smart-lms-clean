const Joi = require('joi');

const authValidation = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    mfaCode: Joi.string().optional()
  }),

  registerOrganization: Joi.object({
    organizationName: Joi.string().required().min(3).max(100),
    subdomain: Joi.string().lowercase().required().min(3).max(30).pattern(/^[a-z0-9-]+$/),
    adminName: Joi.string().required().min(2).max(100),
    adminEmail: Joi.string().email().required(),
    password: Joi.string().required().min(8)
  }),

  applyOrganization: Joi.object({
    organizationName: Joi.string().required().min(3).max(100),
    organizationType: Joi.string().valid('college', 'school', 'institute', 'corporate').required(),
    contactPersonName: Joi.string().required().min(2).max(100),
    contactEmail: Joi.string().email().required(),
    contactPhone: Joi.string().required().min(5).max(30),
    country: Joi.string().required().min(2).max(100),
    state: Joi.string().required().min(2).max(100),
    city: Joi.string().required().min(2).max(100),
    expectedUsers: Joi.number().required().integer().min(1),
    message: Joi.string().optional().allow('').max(2000)
  }),

  completeOrganizationRegistration: Joi.object({
    token: Joi.string().required(),
    name: Joi.string().required().min(2).max(100),
    password: Joi.string().required().min(8)
  }),

  registerUser: Joi.object({
    role: Joi.string().valid('student', 'parent').required(),
    name: Joi.string().required().min(2).max(100),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(8),
    orgSubdomain: Joi.string().required()
  }),

  inviteUser: Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid('instructor', 'support_staff').required()
  }),

  acceptInvite: Joi.object({
    token: Joi.string().required(),
    name: Joi.string().required().min(2).max(100),
    password: Joi.string().required().min(8)
  })
};

const parentValidation = {
  linkChild: Joi.object({
    verificationCode: Joi.string().length(6).required()
  })
};

module.exports = {
  authValidation,
  parentValidation
};
