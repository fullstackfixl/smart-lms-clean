const mongoose = require('mongoose');

let isConnected = false;

// Disable command buffering so requests fail fast if DB is down
mongoose.set('bufferCommands', false);

async function attemptConnect(mongoUri, attempt) {
  console.log(`🔌 [DB] Connecting (attempt ${attempt})...`);
  const conn = await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    family: 4 // Use IPv4, helps with some DNS resolution issues
  });
  console.log(`✅ [DB] Connected: ${conn.connection.host}`);
  return conn;
}

const connectDB = async () => {
  if (isConnected) {
    console.log('MongoDB already connected, skipping...');
    return;
  }

  // Clean URI: remove appName param which can cause auth issues in some setups
  let mongoUri = process.env.MONGODB_URI || "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority";

  // Strip appName if present (can cause auth issues)
  mongoUri = mongoUri.replace(/[&?]appName=[^&]*/g, '');

  let attempts = 0;
  const maxAttempts = 5;
  while (attempts < maxAttempts && !isConnected) {
    try {
      attempts += 1;
      await attemptConnect(mongoUri, attempts);
      isConnected = true;
    } catch (error) {
      console.error(`❌ [DB] Connection attempt ${attempts} failed:`, error.message);
      if (attempts < maxAttempts) {
        const delay = attempts * 2000; // 2s, 4s, 6s, 8s
        console.log(`⏳ [DB] Retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        console.error('❌ [DB] All connection attempts failed.');
        console.error('💡 Please check: 1) MongoDB Atlas credentials 2) IP Whitelist (add 0.0.0.0/0 in Atlas) 3) Cluster not paused');
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
