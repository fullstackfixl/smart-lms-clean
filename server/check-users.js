
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
      isActive: Boolean,
      organization_id: mongoose.Schema.Types.ObjectId
    }));

    const users = await User.find({ role: 'platform_admin' });
    console.log('\n--- Platform Admins ---');
    users.forEach(u => {
      console.log(`ID: ${u._id}, Email: ${u.email}, Role: ${u.role}, Active: ${u.isActive}`);
    });

    const allUsersCount = await User.countDocuments();
    console.log(`\nTotal Users in DB: ${allUsersCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkUsers();
