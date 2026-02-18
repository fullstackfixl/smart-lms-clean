/**
 * Request Validation Middleware using Joi
 * Validates request body, query params, and URL params
 */

const Joi = require('joi');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Property to validate (body, query, params)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errors = error.details.reduce((acc, detail) => {
        acc[detail.path.join('.')] = detail.message;
        return acc;
      }, {});

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Replace request property with validated value
    req[property] = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  // Organization schemas
  createOrganization: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).optional(),
    plan: Joi.string().valid('basic', 'premium').default('basic'),
    address: Joi.object({
      street: Joi.string().max(200).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(100).optional(),
      country: Joi.string().max(100).optional(),
      zipCode: Joi.string().max(20).optional()
    }).optional()
  }),

  updateOrganization: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).optional(),
    plan: Joi.string().valid('basic', 'premium').optional(),
    address: Joi.object({
      street: Joi.string().max(200).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(100).optional(),
      country: Joi.string().max(100).optional(),
      zipCode: Joi.string().max(20).optional()
    }).optional()
  }),

  updateOrganizationStatus: Joi.object({
    status: Joi.string().valid('active', 'suspended').required()
  }),

  // Platform admin schemas
  createPlatformAdmin: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required()
  }),

  updateAdminStatus: Joi.object({
    isActive: Joi.boolean().required()
  }),

  // Query parameter schemas
  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(100).optional(),
    status: Joi.string().valid('active', 'suspended', 'inactive').optional(),
    plan: Joi.string().valid('basic', 'premium').optional(),
    sortBy: Joi.string().valid('created_at', 'name', 'email', 'status', 'plan').default('created_at'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // MongoDB ObjectId validation
  mongoId: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
  }),

  // Subscription schemas
  createSubscription: Joi.object({
    organization_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    plan: Joi.string().valid('basic', 'premium', 'enterprise').required(),
    billing_cycle: Joi.string().valid('monthly', 'yearly').required(),
    start_date: Joi.date().iso().optional(),
    end_date: Joi.date().iso().greater(Joi.ref('start_date')).optional()
  }),

  updateSubscription: Joi.object({
    plan: Joi.string().valid('basic', 'premium', 'enterprise').optional(),
    billing_cycle: Joi.string().valid('monthly', 'yearly').optional(),
    status: Joi.string().valid('active', 'cancelled', 'expired').optional()
  }),

  // System config schemas
  updateSystemConfig: Joi.object({
    maintenance_mode: Joi.boolean().optional(),
    registration_enabled: Joi.boolean().optional(),
    max_organizations: Joi.number().integer().min(1).optional(),
    default_plan: Joi.string().valid('basic', 'premium').optional(),
    features: Joi.object().optional()
  })
};

module.exports = {
  validate,
  schemas
};
