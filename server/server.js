const http = require('http');
require('dotenv').config();

console.log('Starting Smart LMS Server...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

const connectDB = require('./src/config/database');
const app = require('./src/app');
const { transporter } = require('./src/services/mailer');

// Verify transporter on server start
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Error:", error);
  } else {
    console.log("SMTP Server is ready to send emails");
  }
});

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
        console.error(`❌ Port ${PORT} is already in use`);
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
  process.exit(1);
});

startServer();
