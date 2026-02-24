const logger = require('./logger');

/**
 * Environment Variable Validator
 * Validates required environment variables on application startup
 */
class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.requiredVars = new Map();
    this.optionalVars = new Map();
    
    this.setupValidationRules();
  }

  /**
   * Setup validation rules for environment variables
   */
  setupValidationRules() {
    // Required variables with validation rules
    this.requiredVars.set('NODE_ENV', {
      validator: (value) => ['development', 'staging', 'production'].includes(value),
      message: 'NODE_ENV must be one of: development, staging, production'
    });

    this.requiredVars.set('PORT', {
      validator: (value) => !isNaN(value) && parseInt(value) > 0 && parseInt(value) < 65536,
      message: 'PORT must be a valid port number (1-65535)'
    });

    this.requiredVars.set('JWT_SECRET', {
      validator: (value) => value && value.length >= 32,
      message: 'JWT_SECRET must be at least 32 characters long for security'
    });

    this.requiredVars.set('JWT_EXPIRES_IN', {
      validator: (value) => /^(\d+[smhdw]|never)$/.test(value),
      message: 'JWT_EXPIRES_IN must be a valid time format (e.g., 1h, 7d, 30d)'
    });

    // Optional variables with validation rules
    this.optionalVars.set('MONGODB_URI', {
      validator: (value) => !value || value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'),
      message: 'MONGODB_URI must be a valid MongoDB connection string'
    });

    this.optionalVars.set('REDIS_URL', {
      validator: (value) => !value || value.startsWith('redis://') || value.startsWith('rediss://'),
      message: 'REDIS_URL must be a valid Redis connection string'
    });

    this.optionalVars.set('CLIENT_URL', {
      validator: (value) => !value || /^https?:\/\/.+/.test(value),
      message: 'CLIENT_URL must be a valid HTTP/HTTPS URL'
    });

    this.optionalVars.set('EMAIL_USER', {
      validator: (value) => !value || value.length > 0,
      message: 'EMAIL_USER must not be empty'
    });
    this.optionalVars.set('EMAIL_PASS', {
      validator: (value) => !value || value.length > 0,
      message: 'EMAIL_PASS must not be empty'
    });
    this.optionalVars.set('EMAIL_FROM', {
      validator: (value) => !value || value.length > 0,
      message: 'EMAIL_FROM must not be empty'
    });
    this.optionalVars.set('SMTP_HOST', {
      validator: (value) => !value || value.length > 0,
      message: 'SMTP_HOST enables SMTP transport when provided'
    });
    this.optionalVars.set('SMTP_PORT', {
      validator: (value) => !value || (!isNaN(value) && parseInt(value) > 0),
      message: 'SMTP_PORT must be a valid port number'
    });
    this.optionalVars.set('SMTP_SECURE', {
      validator: (value) => !value || ['true', 'false'].includes(value.toLowerCase()),
      message: 'SMTP_SECURE must be "true" or "false"'
    });
    this.optionalVars.set('RESEND_API_KEY', {
      validator: (value) => !value || value.length > 0,
      message: 'RESEND_API_KEY enables HTTP email fallback'
    });

    this.optionalVars.set('RAZORPAY_KEY_ID', {
      validator: (value) => !value || value.startsWith('rzp_'),
      message: 'RAZORPAY_KEY_ID must start with "rzp_"'
    });

    this.optionalVars.set('STRIPE_SECRET_KEY', {
      validator: (value) => !value || value.startsWith('sk_'),
      message: 'STRIPE_SECRET_KEY must start with "sk_"'
    });

    this.optionalVars.set('STRIPE_PUBLISHABLE_KEY', {
      validator: (value) => !value || value.startsWith('pk_'),
      message: 'STRIPE_PUBLISHABLE_KEY must start with "pk_"'
    });

    this.optionalVars.set('MAX_FILE_SIZE', {
      validator: (value) => !value || (!isNaN(value) && parseInt(value) > 0),
      message: 'MAX_FILE_SIZE must be a positive number'
    });

    this.optionalVars.set('LOG_LEVEL', {
      validator: (value) => !value || ['error', 'warn', 'info', 'debug'].includes(value),
      message: 'LOG_LEVEL must be one of: error, warn, info, debug'
    });
  }

  /**
   * Validate all environment variables
   * @returns {Object} Validation result
   */
  validate() {
    this.errors = [];
    this.warnings = [];

    // Validate required variables
    for (const [varName, rule] of this.requiredVars) {
      const value = process.env[varName];
      
      if (!value) {
        this.errors.push(`Missing required environment variable: ${varName}`);
        continue;
      }

      if (rule.validator && !rule.validator(value)) {
        this.errors.push(`Invalid ${varName}: ${rule.message}`);
      }
    }

    // Validate optional variables
    for (const [varName, rule] of this.optionalVars) {
      const value = process.env[varName];
      
      if (value && rule.validator && !rule.validator(value)) {
        this.errors.push(`Invalid ${varName}: ${rule.message}`);
      }
    }

    // Check for security issues
    this.validateSecurity();

    // Check for production-specific requirements
    if (process.env.NODE_ENV === 'production') {
      this.validateProduction();
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * Validate security-related environment variables
   */
  validateSecurity() {
    const nodeEnv = process.env.NODE_ENV;
    const jwtSecret = process.env.JWT_SECRET;

    // Check for weak JWT secrets
    if (jwtSecret) {
      const weakSecrets = [
        'secret',
        'password',
        'jwt-secret',
        'your-secret-key',
        'development-secret'
      ];

      if (weakSecrets.some(weak => jwtSecret.toLowerCase().includes(weak))) {
        if (nodeEnv === 'production') {
          this.errors.push('JWT_SECRET appears to be a weak/default secret. Use a strong, unique secret in production.');
        } else {
          this.warnings.push('JWT_SECRET appears to be a weak/default secret. Consider using a stronger secret.');
        }
      }
    }

    // Check for development settings in production
    if (nodeEnv === 'production') {
      if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
        this.errors.push('NODE_TLS_REJECT_UNAUTHORIZED=0 is not allowed in production');
      }

      if (process.env.DEBUG) {
        this.warnings.push('DEBUG mode is enabled in production. Consider disabling for performance.');
      }
    }
  }

  /**
   * Validate production-specific requirements
   */
  validateProduction() {
    const requiredForProduction = [
      'MONGODB_URI'
    ];

    for (const varName of requiredForProduction) {
      if (!process.env[varName]) {
        this.errors.push(`${varName} is required in production environment`);
      }
    }

    // Redis is optional if notifications are disabled
    if (process.env.ENABLE_NOTIFICATIONS === 'true' && !process.env.REDIS_URL) {
      this.errors.push('REDIS_URL is required when ENABLE_NOTIFICATIONS is true');
    }

    // Check for localhost URLs in production
    const urlVars = ['CLIENT_URL', 'MONGODB_URI', 'REDIS_URL'];
    for (const varName of urlVars) {
      const value = process.env[varName];
      if (value && (value.includes('localhost') || value.includes('127.0.0.1'))) {
        this.warnings.push(`${varName} contains localhost/127.0.0.1 in production environment`);
      }
    }

    // Check SSL configuration
    if (!process.env.SSL_CERT_PATH || !process.env.SSL_KEY_PATH) {
      this.warnings.push('SSL certificate paths not configured. HTTPS is recommended for production.');
    }
  }

  /**
   * Get environment summary for logging
   * @returns {Object} Environment summary
   */
  getEnvironmentSummary() {
    const summary = {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      hasDatabase: !!process.env.MONGODB_URI,
      hasRedis: !!process.env.REDIS_URL,
      hasEmail: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      hasCloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
      hasRazorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      hasStripe: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY),
      hasExpo: !!process.env.EXPO_ACCESS_TOKEN,
      notificationsEnabled: process.env.ENABLE_NOTIFICATIONS === 'true',
      pushNotificationsEnabled: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
      emailNotificationsEnabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true'
    };

    return summary;
  }

  /**
   * Log validation results
   * @param {Object} result - Validation result
   */
  logResults(result) {
    const summary = this.getEnvironmentSummary();

    logger.info('Environment validation completed', {
      environment: summary.nodeEnv,
      port: summary.port,
      services: {
        database: summary.hasDatabase ? 'configured' : 'not configured',
        redis: summary.hasRedis ? 'configured' : 'not configured',
        email: summary.hasEmail ? 'configured' : 'not configured',
        cloudinary: summary.hasCloudinary ? 'configured' : 'not configured',
        razorpay: summary.hasRazorpay ? 'configured' : 'not configured',
        stripe: summary.hasStripe ? 'configured' : 'not configured',
        expo: summary.hasExpo ? 'configured' : 'not configured'
      },
      notifications: {
        enabled: summary.notificationsEnabled,
        push: summary.pushNotificationsEnabled,
        email: summary.emailNotificationsEnabled
      }
    });

    if (result.warnings.length > 0) {
      logger.warn('Environment validation warnings:', {
        warnings: result.warnings
      });
    }

    if (result.errors.length > 0) {
      logger.error('Environment validation errors:', {
        errors: result.errors
      });
    }
  }

  /**
   * Validate and exit if errors found
   */
  validateAndExit() {
    const result = this.validate();
    this.logResults(result);

    if (!result.isValid) {
      logger.error('Environment validation failed. Application cannot start.', {
        errors: result.errors
      });
      
      console.error('\n❌ Environment Validation Failed\n');
      console.error('The following environment variables are missing or invalid:\n');
      
      result.errors.forEach((error, index) => {
        console.error(`${index + 1}. ${error}`);
      });
      
      console.error('\nPlease check your .env file and ensure all required variables are set.');
      console.error('Refer to .env.example for the complete list of variables.\n');
      
      process.exit(1);
    }

    if (result.warnings.length > 0) {
      console.warn('\n⚠️  Environment Validation Warnings\n');
      result.warnings.forEach((warning, index) => {
        console.warn(`${index + 1}. ${warning}`);
      });
      console.warn('');
    }

    logger.info('✅ Environment validation passed');
    return result;
  }

  /**
   * Generate environment setup guide
   * @returns {string} Setup guide
   */
  generateSetupGuide() {
    const guide = `
# Smart LMS Environment Setup Guide

## Required Environment Variables

The following environment variables are required for the application to start:

${Array.from(this.requiredVars.keys()).map(varName => {
  const rule = this.requiredVars.get(varName);
  return `- **${varName}**: ${rule.message}`;
}).join('\n')}

## Optional Environment Variables

The following environment variables are optional but recommended:

${Array.from(this.optionalVars.keys()).map(varName => {
  const rule = this.optionalVars.get(varName);
  return `- **${varName}**: ${rule.message}`;
}).join('\n')}

## Setup Instructions

1. Copy the example environment file:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. Edit the .env file with your actual values:
   \`\`\`bash
   nano .env
   \`\`\`

3. Generate a secure JWT secret:
   \`\`\`bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   \`\`\`

4. Validate your configuration:
   \`\`\`bash
   npm run validate-env
   \`\`\`

## Production Considerations

- Use strong, unique secrets
- Enable HTTPS with valid SSL certificates
- Use managed database services
- Enable monitoring and logging
- Rotate secrets regularly
- Use environment-specific configurations

For more information, see the deployment documentation.
`;

    return guide;
  }
}

// Create singleton instance
const envValidator = new EnvironmentValidator();

module.exports = envValidator;
