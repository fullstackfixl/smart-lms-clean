const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

console.log('Loading app-safe.js...');

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Basic middleware
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart LMS API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart LMS API is running',
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
  app.use(security.helmetConfig);
  app.use(security.additionalSecurityHeaders);
  app.use(security.xssConfig);
  app.use(security.mongoSanitizeConfig);
  app.use(security.sanitizeInput);
}

// Core routes
const healthRoutes = safeRequire('./routes/health', 'health routes');
if (healthRoutes) app.use('/', healthRoutes);

const authRoutes = safeRequire('./routes/auth', 'auth routes');
if (authRoutes) app.use('/auth', authRoutes);

const publicRoutes = safeRequire('./routes/public', 'public routes');
if (publicRoutes) app.use('/api', publicRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
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