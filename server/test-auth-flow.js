/**
 * Test script to verify the complete authentication flow
 * Tests: Registration → OTP Verification → Login
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const VerificationOTP = require('./src/models/VerificationOTP');
const bcrypt = require('bcryptjs');

async function testAuthFlow() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const testEmail = 'test-auth-' + Date.now() + '@example.com';
    const testPassword = 'TestPassword123';
    const testName = 'Test User';

    console.log('📧 Test Email:', testEmail);
    console.log('🔑 Test Password:', testPassword);
    console.log('');

    // Step 1: Simulate user creation (what happens in verify-otp endpoint)
    console.log('Step 1: Creating user with plain password...');
    const newUser = new User({
      email: testEmail.toLowerCase(),
      password_hash: testPassword, // Plain password - should be hashed by pre-save hook
      name: testName,
      role: 'student',
      organization_id: null,
      isActive: true,
      email_verified: true
    });

    await newUser.save();
    console.log('✅ User created');
    console.log('   User ID:', newUser._id);
    console.log('   Email:', newUser.email);
    console.log('   Email Verified:', newUser.email_verified);
    console.log('');

    // Step 2: Fetch user and check password hash
    console.log('Step 2: Fetching user to verify password hash...');
    const fetchedUser = await User.findOne({ email: testEmail.toLowerCase() }).select('+password_hash');
    console.log('   Password Hash:', fetchedUser.password_hash.substring(0, 30) + '...');
    console.log('   Is Bcrypt Hash?', fetchedUser.password_hash.match(/^\$2[aby]\$/) ? 'YES ✅' : 'NO ❌');
    console.log('');

    // Step 3: Test password comparison (what happens in login)
    console.log('Step 3: Testing password comparison...');
    const isMatch = await fetchedUser.comparePassword(testPassword);
    console.log('   Password Match:', isMatch ? 'YES ✅' : 'NO ❌');
    console.log('');

    // Step 4: Test with bcrypt.compare directly
    console.log('Step 4: Testing with bcrypt.compare directly...');
    const directMatch = await bcrypt.compare(testPassword, fetchedUser.password_hash);
    console.log('   Direct Match:', directMatch ? 'YES ✅' : 'NO ❌');
    console.log('');

    // Step 5: Test login flow simulation
    console.log('Step 5: Simulating login flow...');
    const loginUser = await User.findOne({ email: testEmail.toLowerCase() }).select('+password_hash');
    
    if (!loginUser) {
      console.log('❌ User not found');
    } else if (!loginUser.isActive) {
      console.log('❌ Account is deactivated');
    } else {
      const isPasswordValid = await loginUser.comparePassword(testPassword);
      if (!isPasswordValid) {
        console.log('❌ Invalid password');
      } else if (loginUser.organization_id && !loginUser.email_verified) {
        console.log('❌ Email not verified');
      } else {
        console.log('✅ Login would succeed!');
      }
    }
    console.log('');

    // Cleanup
    console.log('🧹 Cleaning up test user...');
    await User.deleteOne({ email: testEmail.toLowerCase() });
    console.log('✅ Test user deleted\n');

    console.log('='.repeat(50));
    console.log('TEST COMPLETE');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

testAuthFlow();
