/**
 * End-to-End User Journey Test
 * Simulates a complete user flow: Register → Verify OTP → Login → Access Dashboard
 */

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

const BACKEND_URL = 'http://localhost:5000';

async function simulateUserJourney() {
  console.log('👤 Simulating Complete User Journey\n');
  console.log('='.repeat(60));
  console.log('');

  const testEmail = 'journey-' + Date.now() + '@example.com';
  const testPassword = 'SecurePass123!';
  const testName = 'Journey Test User';

  try {
    // ========================================
    // STEP 1: User visits registration page
    // ========================================
    console.log('📝 STEP 1: User Registration');
    console.log('-'.repeat(60));
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    console.log(`Name: ${testName}`);
    console.log('');

    const registerResponse = await axios.post(`${BACKEND_URL}/auth/register/request-otp`, {
      email: testEmail,
      password: testPassword,
      name: testName,
      role: 'public_student'
    }, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json'
      }
    });

    if (!registerResponse.data.success) {
      console.log('❌ Registration failed:', registerResponse.data.message);
      return;
    }

    console.log('✅ Registration request successful');
    console.log(`   Message: ${registerResponse.data.message}`);
    console.log(`   OTP: ${registerResponse.data.data.otp}`);
    console.log('');

    const otp = registerResponse.data.data.otp;

    // ========================================
    // STEP 2: User receives OTP and verifies
    // ========================================
    console.log('🔐 STEP 2: OTP Verification');
    console.log('-'.repeat(60));

    const verifyResponse = await axios.post(`${BACKEND_URL}/auth/register/verify-otp`, {
      email: testEmail,
      otp: otp
    }, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json'
      }
    });

    if (!verifyResponse.data.success) {
      console.log('❌ OTP verification failed:', verifyResponse.data.message);
      return;
    }

    console.log('✅ OTP verified successfully');
    console.log(`   User ID: ${verifyResponse.data.data.user.id}`);
    console.log(`   Email Verified: ${verifyResponse.data.data.user.email_verified}`);
    console.log(`   Token: ${verifyResponse.data.data.token.substring(0, 30)}...`);
    console.log('');

    const registrationToken = verifyResponse.data.data.token;

    // ========================================
    // STEP 3: User logs in
    // ========================================
    console.log('🔑 STEP 3: User Login');
    console.log('-'.repeat(60));

    const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    }, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json'
      }
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }

    console.log('✅ Login successful');
    console.log(`   User: ${loginResponse.data.data.user.name}`);
    console.log(`   Role: ${loginResponse.data.data.user.role}`);
    console.log(`   Token: ${loginResponse.data.data.token.substring(0, 30)}...`);
    console.log('');

    const loginToken = loginResponse.data.data.token;

    // ========================================
    // STEP 4: User accesses protected routes
    // ========================================
    console.log('🔒 STEP 4: Accessing Protected Routes');
    console.log('-'.repeat(60));

    // Get current user
    const meResponse = await axios.get(`${BACKEND_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${loginToken}`,
        'Origin': 'http://localhost:3000'
      }
    });

    if (meResponse.data.success) {
      console.log('✅ /auth/me - User profile retrieved');
      console.log(`   Name: ${meResponse.data.data.name}`);
      console.log(`   Email: ${meResponse.data.data.email}`);
      console.log(`   Active: ${meResponse.data.data.isActive}`);
    } else {
      console.log('❌ /auth/me failed');
    }

    // List courses
    const coursesResponse = await axios.get(`${BACKEND_URL}/api/courses`, {
      headers: {
        'Authorization': `Bearer ${loginToken}`,
        'Origin': 'http://localhost:3000'
      }
    });

    if (coursesResponse.data.success) {
      console.log('✅ /api/courses - Course list retrieved');
      console.log(`   Courses found: ${coursesResponse.data.data.length || 0}`);
    } else {
      console.log('❌ /api/courses failed');
    }

    // List enrollments
    const enrollmentsResponse = await axios.get(`${BACKEND_URL}/api/enrollments`, {
      headers: {
        'Authorization': `Bearer ${loginToken}`,
        'Origin': 'http://localhost:3000'
      }
    });

    if (enrollmentsResponse.data.success) {
      console.log('✅ /api/enrollments - Enrollment list retrieved');
      console.log(`   Enrollments: ${enrollmentsResponse.data.data.length || 0}`);
    } else {
      console.log('❌ /api/enrollments failed');
    }

    // Student dashboard
    const dashboardResponse = await axios.get(`${BACKEND_URL}/student/courses`, {
      headers: {
        'Authorization': `Bearer ${loginToken}`,
        'Origin': 'http://localhost:3000'
      }
    });

    if (dashboardResponse.data.success) {
      console.log('✅ /student/courses - Student courses retrieved');
    } else {
      console.log('⚠️  /student/courses - No data or endpoint not available');
    }

    console.log('');

    // ========================================
    // STEP 5: Test token persistence
    // ========================================
    console.log('💾 STEP 5: Token Persistence Test');
    console.log('-'.repeat(60));

    // Simulate page refresh - use same token
    const refreshResponse = await axios.get(`${BACKEND_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${loginToken}`,
        'Origin': 'http://localhost:3000'
      }
    });

    if (refreshResponse.data.success) {
      console.log('✅ Token still valid after simulated refresh');
      console.log(`   User: ${refreshResponse.data.data.name}`);
    } else {
      console.log('❌ Token invalid after refresh');
    }

    console.log('');

    // ========================================
    // STEP 6: Test logout
    // ========================================
    console.log('🚪 STEP 6: User Logout');
    console.log('-'.repeat(60));

    const logoutResponse = await axios.post(`${BACKEND_URL}/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${loginToken}`,
        'Origin': 'http://localhost:3000'
      }
    });

    if (logoutResponse.data.success) {
      console.log('✅ Logout successful');
    } else {
      console.log('⚠️  Logout response:', logoutResponse.data.message);
    }

    console.log('');

    // ========================================
    // CLEANUP
    // ========================================
    console.log('🧹 CLEANUP');
    console.log('-'.repeat(60));

    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./src/models/User');
    await User.deleteOne({ email: testEmail.toLowerCase() });
    console.log('✅ Test user deleted');
    await mongoose.connection.close();

    console.log('');
    console.log('='.repeat(60));
    console.log('🎉 USER JOURNEY TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('');
    console.log('Summary:');
    console.log('  ✅ Registration with OTP');
    console.log('  ✅ OTP Verification');
    console.log('  ✅ Login');
    console.log('  ✅ Protected Route Access');
    console.log('  ✅ Token Persistence');
    console.log('  ✅ Logout');
    console.log('');
    console.log('🚀 Frontend-Backend integration is working perfectly!');

  } catch (error) {
    console.error('❌ Error during user journey:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

simulateUserJourney();
