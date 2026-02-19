/**
 * Verify User Created in Database
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function verifyUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = require('./src/models/User');
    const user = await User.findOne({ email: 'dushyantkhandelwal4665@gmail.com' }).select('+password_hash');

    if (!user) {
      console.log('❌ User NOT found in database');
      return;
    }

    console.log('✅ User found in database:');
    console.log('   ID:', user._id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Email Verified:', user.email_verified);
    console.log('   Active:', user.isActive);
    console.log('   Password Hash:', user.password_hash.substring(0, 30) + '...');
    console.log('   Is Bcrypt Hash:', user.password_hash.match(/^\$2[aby]\$/) ? 'YES ✅' : 'NO ❌');
    console.log('   Created:', user.created_at);
    console.log('');

    // Test password comparison
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare('SecurePass123!', user.password_hash);
    console.log('Password Comparison Test:', isMatch ? 'PASS ✅' : 'FAIL ❌');
    console.log('');

    console.log('🎉 User is properly created and ready for login!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

verifyUser();
