const http = require('http');
require('dotenv').config();

console.log('Starting Smart LMS Server...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT || 5000);

// Validate environment variables before starting
console.log('Validating environment variables...');
const envValidator = require('./src/utils/envValidator');
envValidator.validateAndExit();
console.log('Environment validation passed');

console.log('Loading dependencies...');
const connectDB = require('./src/config/database');
const notificationWorker = require('./src/workers/notificationWorker');
const socketService = require('./src/services/socketService');
const logger = require('./src/utils/logger');
const ErrorHandler = require('./src/middleware/errorHandler');

console.log('Loading Express app...');
// Import the security-enhanced app
let app;
try {
  app = require('./src/app');
  console.log('Express app loaded successfully');
} catch (error) {
  console.error('❌ Failed to load main app, using safe mode:', error.message);
  console.error(error.stack);
  app = require('./src/app-safe');
  console.log('✅ Safe mode app loaded');
}

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Async startup function
async function startServer() {
  try {
    console.log('Connecting to MongoDB...');
    // Connect to MongoDB
    await connectDB();
    console.log('MongoDB connection initiated');

    console.log('Initializing Socket.IO...');
    // Initialize Socket.IO
    socketService.initialize(server);
    console.log('Socket.IO initialized');

    console.log(`Starting HTTP server on port ${PORT}...`);
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`✅ Smart LMS Server running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV}`);
      console.log(`✅ Socket.IO enabled for real-time features`);

      // Start notification worker
      try {
        notificationWorker.start();
        logger.info('Notification worker started successfully');
      } catch (error) {
        logger.error('Failed to start notification worker:', error);
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

// Start the server
console.log('Calling startServer()...');
startServer().catch(error => {
  console.error('❌ Unhandled error in startServer:', error);
  console.error('Error stack:', error.stack);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    await notificationWorker.stop();
    logger.info('Notification worker stopped');
  } catch (error) {
    logger.error('Error stopping notification worker:', error);
  }

  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');

  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    await notificationWorker.stop();
    logger.info('Notification worker stopped');
  } catch (error) {
    logger.error('Error stopping notification worker:', error);
  }

  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', ErrorHandler.handleUncaughtException);

// Handle unhandled promise rejections
process.on('unhandledRejection', ErrorHandler.handleUnhandledRejection);