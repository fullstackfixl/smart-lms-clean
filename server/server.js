const http = require('http');
require('dotenv').config();

const connectDB = require('./src/config/database');
const app = require('./src/app');

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

startServer();
