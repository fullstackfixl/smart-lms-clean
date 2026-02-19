const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

console.log('Loading app-safe.js...');

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// CORS - Allow all origins for now
const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart LMS API is running (Safe Mode)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart LMS API is running (Safe Mode)',
    data: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime: process.uptime()
    }
  });
});

// Load routes with error handling
function safeRequire(path, name) {
  try {
    console.log(`Loading ${name}...`);
    const route = require(path);
    console.log(`✅ ${name} loaded`);
    return route;
  } catch (error) {
    console.error(`❌ Failed to load ${name}:`, error.message);
    console.error(error.stack);
    return null;
  }
}

// Security middleware
const security = safeRequire('./middleware/security', 'security');
if (security) {
  try {
    app.use(security.helmetConfig);
    app.use(security.additionalSecurityHeaders);
    app.use(security.xssConfig);
    app.use(security.mongoSanitizeConfig);
    app.use(security.sanitizeInput);
  } catch (error) {
    console.error('Security middleware error:', error.message);
  }
}

// Core routes
const healthRoutes = safeRequire('./routes/health', 'health routes');
if (healthRoutes) app.use('/', healthRoutes);

const authRoutes = safeRequire('./routes/auth', 'auth routes');
if (authRoutes) {
  console.log('Mounting auth routes on /auth');
  app.use('/auth', authRoutes);
}

const publicRoutes = safeRequire('./routes/public', 'public routes');
if (publicRoutes) app.use('/api', publicRoutes);

const organizationRoutes = safeRequire('./routes/organizations', 'organization routes');
if (organizationRoutes) app.use('/api/organizations', organizationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

console.log('App-safe configuration complete');

module.exports = app;