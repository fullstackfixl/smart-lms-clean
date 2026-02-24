const crypto = require('crypto');

/**
 * Custom CSRF Protection Middleware
 * Alternative to deprecated csurf package
 */

// Store for CSRF tokens (in production, use Redis)
const tokenStore = new Map();

// Token expiration time (1 hour)
const TOKEN_EXPIRY = 60 * 60 * 1000;

/**
 * Generate CSRF token
 * @returns {string}
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF Protection Middleware
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for auth endpoints (login, register, etc.)
  const authEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/register/request-otp',
    '/auth/register/verify-otp',
    '/auth/register/resend-otp',
    '/auth/register/student',
    '/auth/verify-otp',
    '/auth/resend-otp',
    '/auth/validate-organization',
    '/auth/forgot-password',
    '/auth/reset-password',
    // Student registration routes
    '/api/student/validate-organization',
    '/api/student/send-verification',
    '/api/student/complete-registration'
  ];
  
  if (authEndpoints.includes(req.path)) {
    console.log('✅ [CSRF] Skipping CSRF for auth endpoint:', req.path);
    return next();
  }

  // Get token from header or body
  const token = req.headers['x-csrf-token'] || req.body._csrf;

  if (!token) {
    console.log('⚠️ [CSRF] Token missing from request');
    return res.status(403).json({
      success: false,
      error: 'CSRF token missing',
      message: 'CSRF token is required for this request'
    });
  }

  // Get sessionId from cookie or create a temporary one
  let sessionId = req.cookies.sessionId;
  
  if (!sessionId) {
    console.log('⚠️ [CSRF] No sessionId cookie found, checking token directly');
    // If no sessionId, check if token exists in any session
    let found = false;
    for (const [sid, data] of tokenStore.entries()) {
      if (data.token === token && Date.now() <= data.expiresAt) {
        found = true;
        sessionId = sid;
        break;
      }
    }
    
    if (!found) {
      console.log('⚠️ [CSRF] Token not found in any session');
      return res.status(403).json({
        success: false,
        error: 'Session not found',
        message: 'Please refresh the page and try again'
      });
    }
  }

  const storedToken = tokenStore.get(sessionId);

  if (!storedToken) {
    console.log('⚠️ [CSRF] Token expired or not found for session:', sessionId);
    return res.status(403).json({
      success: false,
      error: 'CSRF token expired',
      message: 'Please refresh the page and try again'
    });
  }

  // Check if token matches
  if (storedToken.token !== token) {
    console.log('⚠️ [CSRF] Token mismatch');
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      message: 'CSRF token validation failed'
    });
  }

  // Check if token is expired
  if (Date.now() > storedToken.expiresAt) {
    tokenStore.delete(sessionId);
    console.log('⚠️ [CSRF] Token expired');
    return res.status(403).json({
      success: false,
      error: 'CSRF token expired',
      message: 'Please refresh the page and try again'
    });
  }

  console.log('✅ [CSRF] Token validated successfully');
  next();
};

/**
 * Generate and attach CSRF token to request
 */
const attachCsrfToken = (req, res, next) => {
  let sessionId = req.cookies.sessionId;
  
  // If no sessionId, create one
  if (!sessionId) {
    sessionId = crypto.randomBytes(16).toString('hex');
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: false, // Allow in development
      sameSite: 'lax',
      maxAge: TOKEN_EXPIRY
    });
    console.log('🔐 [CSRF] Created new sessionId:', sessionId);
  }
  
  // Generate new token only if one doesn't exist or is expired
  let storedToken = tokenStore.get(sessionId);
  
  if (!storedToken || Date.now() > storedToken.expiresAt) {
    const token = generateToken();
    const expiresAt = Date.now() + TOKEN_EXPIRY;
    storedToken = { token, expiresAt };
    tokenStore.set(sessionId, storedToken);
    console.log('🔐 [CSRF] Generated new token for session:', sessionId);
  }

  // Attach token to request
  req.csrfToken = () => storedToken.token;

  next();
};

/**
 * CSRF token endpoint
 */
const csrfTokenEndpoint = (req, res) => {
  const token = req.csrfToken();
  console.log('🔐 [CSRF] Token requested, returning:', token.substring(0, 10) + '...');
  res.json({
    success: true,
    data: {
      csrfToken: token
    }
  });
};

/**
 * Cleanup expired tokens (run periodically)
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [sessionId, data] of tokenStore.entries()) {
    if (now > data.expiresAt) {
      tokenStore.delete(sessionId);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupExpiredTokens, 10 * 60 * 1000);

/**
 * CSRF error handler
 */
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN' || err.message?.includes('CSRF')) {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      message: 'Form submission rejected. Please refresh and try again.'
    });
  }
  next(err);
};

module.exports = {
  csrfProtection,
  attachCsrfToken,
  csrfTokenEndpoint,
  csrfErrorHandler
};
