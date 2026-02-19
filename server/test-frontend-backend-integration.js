/**
 * Comprehensive Frontend-Backend Integration Test
 * Tests all critical API endpoints that the frontend uses
 */

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';

// Test results tracker
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function logTest(name, status, details = '') {
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${emoji} ${name}${details ? ': ' + details : ''}`);
  
  if (status === 'pass') results.passed.push(name);
  else if (status === 'fail') results.failed.push({ name, details });
  else results.warnings.push({ name, details });
}

async function testEndpoint(name, method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BACKEND_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data && method !== 'GET') {
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (response.data.success) {
      logTest(name, 'pass', `${response.status}`);
      return { success: true, data: response.data };
    } else {
      logTest(name, 'fail', `Success=false: ${response.data.message}`);
      return { success: false, error: response.data.message };
    }
  } catch (error) {
    if (error.response) {
      logTest(name, 'fail', `${error.response.status}: ${error.response.data.message || error.response.data.error}`);
    } else {
      logTest(name, 'fail', error.message);
    }
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Frontend-Backend Integration Tests\n');
  console.log('Backend URL:', BACKEND_URL);
  console.log('Frontend URL:', FRONTEND_URL);
  console.log('='.repeat(60));
  console.log('');

  // Test data
  const testEmail = 'integration-test-' + Date.now() + '@example.com';
  const testPassword = 'TestPassword123';
  const testName = 'Integration Test User';
  let authToken = null;
  let userId = null;

  // ========================================
  // 1. HEALTH & CONNECTIVITY TESTS
  // ========================================
  console.log('📡 1. HEALTH & CONNECTIVITY TESTS');
  console.log('-'.repeat(60));
  
  await testEndpoint('Backend Health Check', 'GET', '/');
  await testEndpoint('API Health Check', 'GET', '/api/health');
  
  // Test CORS
  try {
    const corsTest = await axios.options(`${BACKEND_URL}/auth/login`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    logTest('CORS Preflight', 'pass', `${corsTest.status}`);
  } catch (error) {
    logTest('CORS Preflight', 'fail', error.message);
  }
  
  console.log('');

  // ========================================
  // 2. AUTHENTICATION FLOW TESTS
  // ========================================
  console.log('🔐 2. AUTHENTICATION FLOW TESTS');
  console.log('-'.repeat(60));
  
  // Request OTP
  const otpResult = await testEndpoint(
    'Request OTP (Registration)',
    'POST',
    '/auth/register/request-otp',
    {
      email: testEmail,
      password: testPassword,
      name: testName,
      role: 'public_student'
    }
  );
  
  if (!otpResult.success) {
    console.log('\n❌ Cannot continue without OTP. Stopping tests.\n');
    return;
  }
  
  const otp = otpResult.data.data.otp;
  console.log(`   📧 OTP: ${otp}`);
  
  // Verify OTP
  const verifyResult = await testEndpoint(
    'Verify OTP (Complete Registration)',
    'POST',
    '/auth/register/verify-otp',
    {
      email: testEmail,
      otp: otp
    }
  );
  
  if (verifyResult.success) {
    authToken = verifyResult.data.data.token;
    userId = verifyResult.data.data.user.id;
    console.log(`   🎫 Token: ${authToken.substring(0, 30)}...`);
    console.log(`   👤 User ID: ${userId}`);
  }
  
  // Login
  const loginResult = await testEndpoint(
    'Login',
    'POST',
    '/auth/login',
    {
      email: testEmail,
      password: testPassword
    }
  );
  
  if (loginResult.success) {
    authToken = loginResult.data.data.token;
    console.log(`   🎫 Login Token: ${authToken.substring(0, 30)}...`);
  }
  
  // Get Current User
  await testEndpoint(
    'Get Current User (/auth/me)',
    'GET',
    '/auth/me',
    null,
    { 'Authorization': `Bearer ${authToken}` }
  );
  
  // Test Invalid Login
  const invalidLogin = await testEndpoint(
    'Invalid Login (Should Fail)',
    'POST',
    '/auth/login',
    {
      email: testEmail,
      password: 'WrongPassword123'
    }
  );
  
  if (!invalidLogin.success) {
    logTest('Invalid Login Properly Rejected', 'pass');
  } else {
    logTest('Invalid Login Properly Rejected', 'fail', 'Should have failed but succeeded');
  }
  
  console.log('');

  // ========================================
  // 3. COURSE API TESTS
  // ========================================
  console.log('📚 3. COURSE API TESTS');
  console.log('-'.repeat(60));
  
  await testEndpoint(
    'List Public Courses',
    'GET',
    '/api/courses',
    null,
    { 'Authorization': `Bearer ${authToken}` }
  );
  
  await testEndpoint(
    'Get Course Details (Non-existent)',
    'GET',
    '/api/courses/507f1f77bcf86cd799439011',
    null,
    { 'Authorization': `Bearer ${authToken}` }
  );
  
  console.log('');

  // ========================================
  // 4. ENROLLMENT API TESTS
  // ========================================
  console.log('📝 4. ENROLLMENT API TESTS');
  console.log('-'.repeat(60));
  
  await testEndpoint(
    'List My Enrollments',
    'GET',
    '/api/enrollments',
    null,
    { 'Authorization': `Bearer ${authToken}` }
  );
  
  console.log('');

  // ========================================
  // 5. PLATFORM ADMIN API TESTS
  // ========================================
  console.log('👑 5. PLATFORM ADMIN API TESTS');
  console.log('-'.repeat(60));
  
  // These should fail for regular users
  const platformTest = await testEndpoint(
    'List Organizations (Should Fail - Not Admin)',
    'GET',
    '/platform/organizations',
    null,
    { 'Authorization': `Bearer ${authToken}` }
  );
  
  if (!platformTest.success) {
    logTest('Platform Admin Protection Working', 'pass', 'Correctly rejected non-admin');
  } else {
    logTest('Platform Admin Protection Working', 'fail', 'Should have rejected non-admin');
  }
  
  console.log('');

  // ========================================
  // 6. INSTRUCTOR API TESTS
  // ========================================
  console.log('👨‍🏫 6. INSTRUCTOR API TESTS');
  console.log('-'.repeat(60));
  
  // These should fail for students
  const instructorTest = await testEndpoint(
    'List Instructor Courses (Should Fail - Not Instructor)',
    'GET',
    '/instructor/courses',
    null,
    { 'Authorization': `Bearer ${authToken}` }
  );
  
  if (!instructorTest.success) {
    logTest('Instructor Protection Working', 'pass', 'Correctly rejected non-instructor');
  } else {
    logTest('Instructor Protection Working', 'fail', 'Should have rejected non-instructor');
  }
  
  console.log('');

  // ========================================
  // 7. STUDENT API TESTS
  // ========================================
  console.log('🎓 7. STUDENT API TESTS');
  console.log('-'.repeat(60));
  
  await testEndpoint(
    'Student Dashboard',
    'GET',
    '/student/dashboard',
    null,
    { 'Authorization': `Bearer ${authToken}` }
  );
  
  await testEndpoint(
    'Discover Courses',
    'GET',
    '/student/courses',
    null,
    { 'Authorization': `Bearer ${authToken}` }
  );
  
  console.log('');

  // ========================================
  // 8. ORGANIZATION API TESTS
  // ========================================
  console.log('🏢 8. ORGANIZATION API TESTS');
  console.log('-'.repeat(60));
  
  await testEndpoint(
    'Validate Organization Code (Invalid)',
    'POST',
    '/auth/validate-organization',
    { organizationCode: 'INVALID' }
  );
  
  console.log('');

  // ========================================
  // 9. CLEANUP
  // ========================================
  console.log('🧹 9. CLEANUP');
  console.log('-'.repeat(60));
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./src/models/User');
    await User.deleteOne({ email: testEmail.toLowerCase() });
    logTest('Test User Deleted', 'pass');
    await mongoose.connection.close();
  } catch (error) {
    logTest('Test User Cleanup', 'fail', error.message);
  }
  
  console.log('');

  // ========================================
  // SUMMARY
  // ========================================
  console.log('='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log('');
  
  if (results.failed.length > 0) {
    console.log('Failed Tests:');
    results.failed.forEach((fail, i) => {
      console.log(`  ${i + 1}. ${fail.name}: ${fail.details}`);
    });
    console.log('');
  }
  
  if (results.warnings.length > 0) {
    console.log('Warnings:');
    results.warnings.forEach((warn, i) => {
      console.log(`  ${i + 1}. ${warn.name}: ${warn.details}`);
    });
    console.log('');
  }
  
  const successRate = ((results.passed.length / (results.passed.length + results.failed.length)) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);
  console.log('');
  
  if (results.failed.length === 0) {
    console.log('🎉 ALL TESTS PASSED! Frontend-Backend integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the failures above.');
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});
