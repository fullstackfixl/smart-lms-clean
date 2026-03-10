
require('dotenv').config();
const mongoose = require('mongoose');

async function checkUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected');

    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      role: String,
      status: String,
      isActive: Boolean,
      organization_id: mongoose.Schema.Types.ObjectId
    }, { collection: 'users' })); // Force collection name to 'users'

    const allUsers = await User.find({});
    console.log(`\nFound ${allUsers.length} users total.`);
    
    allUsers.forEach(u => {
      console.log('--- User ---');
      console.log('ID:', u._id);
      console.log('Email:', u.email);
      console.log('Role:', u.role);
      console.log('Status:', u.status);
      console.log('Active:', u.isActive);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkUsers();
