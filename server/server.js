const http = require('http');
require('dotenv').config({ override: true });

console.log('Starting Smart LMS Server...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

const connectDB = require('./src/config/database');
const app = require('./src/app');

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('MongoDB connected successfully');

    const io = require('socket.io')(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    global.io = io;

    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);

      socket.on('join_organization', (orgId) => {
        if (orgId) {
          socket.join(`organization_${orgId}`);
          console.log(`User ${socket.id} joined room: organization_${orgId}`);
        }
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Socket.io initialized`);
      console.log(`✅ Environment: ${process.env.NODE_ENV}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Attempting to clear...`);
        // On Windows, taskkill or manual restart is usually needed.
        // We'll log the error and exit so nodemon can retry after the user clears it or we clear it via script.
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  if (reason && reason.stack) {
    console.error('Stack:', reason.stack);
  }
  process.exit(1);
});

startServer();