const http = require('http');
require('dotenv').config();

// Validate environment variables before starting
const envValidator = require('./src/utils/envValidator');
envValidator.validateAndExit();

const connectDB = require('./src/config/database');
const notificationWorker = require('./src/workers/notificationWorker');
const socketService = require('./src/services/socketService');
const logger = require('./src/utils/logger');
const ErrorHandler = require('./src/middleware/errorHandler');

// Import the security-enhanced app
const app = require('./src/app');

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Initialize Socket.IO
socketService.initialize(server);

server.listen(PORT, () => {
  console.log(`Smart LMS Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Socket.IO enabled for real-time features`);

  // Start notification worker
  try {
    notificationWorker.start();
    logger.info('Notification worker started successfully');
  } catch (error) {
    logger.error('Failed to start notification worker:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

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