const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const { csrfProtection, attachCsrfToken, csrfTokenEndpoint, csrfErrorHandler } = require('./csrf');

/**
 * Security Middleware Configuration
 * Implements: Helmet, XSS Protection, NoSQL Injection Protection, CSRF
 */

// Helmet configuration for security headers
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for video/iframe content
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

// MongoDB injection protection
const mongoSanitizeConfig = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[SECURITY] NoSQL injection attempt detected: ${key}`);
  },
});

// XSS protection
const xssConfig = xss();

// Recursive object sanitization
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Remove potentially dangerous keys
    if (key.startsWith('$') || key.startsWith('_')) {
      continue;
    }
    
    if (typeof value === 'string') {
      // Basic XSS prevention
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query params
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

// File upload security middleware
const fileUploadSecurity = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }
  
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav'
  ];
  
  const maxFileSize = 100 * 1024 * 1024; // 100MB
  
  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
  
  for (const file of files) {
    if (!file) continue;
    
    // Check MIME type - allow all video types
    if (!file.mimetype.startsWith('video/') && !allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        message: `File type ${file.mimetype} is not allowed`
      });
    }
    
    // Check file size
    if (file.size > maxFileSize) {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: `File size must be less than ${maxFileSize / 1024 / 1024}MB`
      });
    }
    
    // Check file extension matches MIME type
    const ext = file.originalname.split('.').pop().toLowerCase();
    const mimeToExt = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
      'application/pdf': ['pdf'],
      'video/mp4': ['mp4'],
      'video/webm': ['webm'],
      'audio/mpeg': ['mp3'],
      'audio/wav': ['wav']
    };
    
    // Skip extension check for video files (allow all video extensions)
    if (file.mimetype.startsWith('video/')) {
      continue;
    }
    
    const validExts = mimeToExt[file.mimetype] || [];
    if (validExts.length > 0 && !validExts.includes(ext)) {
      return res.status(400).json({
        success: false,
        error: 'File extension mismatch',
        message: 'File extension does not match file type'
      });
    }
  }
  
  next();
};

// Security headers middleware (additional to helmet)
const additionalSecurityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// Rate limiting by user ID (after authentication)
const userRateLimiter = (maxRequests = 1000, windowMs = 60 * 60 * 1000) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    if (!req.user) return next();
    
    const userId = req.user._id.toString();
    const now = Date.now();
    
    if (!userRequests.has(userId)) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const userData = userRequests.get(userId);
    
    if (now > userData.resetTime) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
      });
    }
    
    userData.count++;
    next();
  };
};

module.exports = {
  helmetConfig,
  mongoSanitizeConfig,
  xssConfig,
  csrfProtection,
  attachCsrfToken,
  csrfTokenEndpoint,
  csrfErrorHandler,
  sanitizeInput,
  fileUploadSecurity,
  additionalSecurityHeaders,
  userRateLimiter
};
