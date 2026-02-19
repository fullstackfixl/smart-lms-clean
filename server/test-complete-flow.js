/**
 * Test complete registration and login flow
 * Simulates: Request OTP → Verify OTP → Login
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testCompleteFlow() {
  try {
    console.log('🚀 Starting complete flow test...\n');

    const testEmail = 'flowtest-' + Date.now() + '@example.com';
    const testPassword = 'TestPassword123';
    const testName = 'Flow Test User';

    console.log('📧 Test Email:', testEmail);
    console.log('🔑 Test Password:', testPassword);
    console.log('');

    // Step 1: Request OTP (public student - no org code needed)
    console.log('Step 1: Requesting OTP...');
    const otpResponse = await axios.post(`${API_BASE}/auth/register/request-otp`, {
      email: testEmail,
      password: testPassword,
      name: testName,
      role: 'public_student'
    });

    console.log('   Status:', otpResponse.status);
    console.log('   Response:', otpResponse.data);
    
    if (!otpResponse.data.success) {
      console.error('❌ Failed to request OTP');
      return;
    }

    const otp = otpResponse.data.data.otp;
    if (!otp) {
      console.error('❌ No OTP in response');
      return;
    }
    console.log('   OTP:', otp);
    console.log('');

    // Step 2: Verify OTP
    console.log('Step 2: Verifying OTP...');
    const verifyResponse = await axios.post(`${API_BASE}/auth/register/verify-otp`, {
      email: testEmail,
      otp: otp
    });

    console.log('   Status:', verifyResponse.status);
    console.log('   Response:', verifyResponse.data);
    
    if (!verifyResponse.data.success) {
      console.error('❌ Failed to verify OTP');
      return;
    }

    const registrationToken = verifyResponse.data.data.token;
    console.log('   Token:', registrationToken ? registrationToken.substring(0, 30) + '...' : 'MISSING');
    console.log('   User:', verifyResponse.data.data.user);
    console.log('');

    // Step 3: Login
    console.log('Step 3: Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: testPassword
    });

    console.log('   Status:', loginResponse.status);
    console.log('   Response:', loginResponse.data);
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed');
      console.error('   Error:', loginResponse.data.error || loginResponse.data.message);
      return;
    }

    const loginToken = loginResponse.data.data.token;
    console.log('   Token:', loginToken ? loginToken.substring(0, 30) + '...' : 'MISSING');
    console.log('   User:', loginResponse.data.data.user);
    console.log('');

    // Step 4: Verify token works
    console.log('Step 4: Verifying token with /auth/me...');
    const meResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${loginToken}`
      }
    });

    console.log('   Status:', meResponse.status);
    console.log('   Response:', meResponse.data);
    console.log('');

    // Cleanup
    console.log('🧹 Cleaning up...');
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./src/models/User');
    await User.deleteOne({ email: testEmail.toLowerCase() });
    await mongoose.connection.close();
    console.log('✅ Test user deleted\n');

    console.log('='.repeat(50));
    console.log('✅ COMPLETE FLOW TEST PASSED');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testCompleteFlow();
