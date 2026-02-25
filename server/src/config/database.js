const mongoose = require('mongoose');

let isConnected = false;

// Disable command buffering so requests fail fast if DB is down
mongoose.set('bufferCommands', false);

async function attemptConnect(mongoUri, attempt) {
  console.log(`🔌 [DB] Connecting (attempt ${attempt})...`);
  const conn = await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10
  });
  console.log(`✅ [DB] Connected: ${conn.connection.host}`);
  return conn;
}

const connectDB = async () => {
  if (isConnected) {
    console.log('MongoDB already connected, skipping...');
    return;
  }

  const mongoUri = process.env.MONGODB_URI || "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0";

  let attempts = 0;
  const maxAttempts = 3;
  while (attempts < maxAttempts && !isConnected) {
    try {
      attempts += 1;
      await attemptConnect(mongoUri, attempts);
      isConnected = true;
    } catch (error) {
      console.error(`❌ [DB] Connection attempt ${attempts} failed:`, error.message);
      if (attempts < maxAttempts) {
        // Exponential backoff: 1s, 2s
        const delay = attempts * 1000;
        await new Promise(r => setTimeout(r, delay));
      } else {
        console.error('❌ [DB] All connection attempts failed. Server will not start without DB.');
        throw error;
      }
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    isConnected = false;
  });
};

module.exports = connectDB;
