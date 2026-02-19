const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  // Prevent duplicate connections
  if (isConnected) {
    console.log('MongoDB already connected, skipping...');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0";
    
    // Connect without deprecated options
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
    });

    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.log('Server will continue without database connection');
    isConnected = false;
  }
};

module.exports = connectDB;