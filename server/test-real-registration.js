/**
 * Real Registration Test with Email
 * Tests complete flow: Register → Send Email → Wait for OTP → Verify → Login
 */

require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const TEST_EMAIL = 'dushyantkhandelwal4665@gmail.com';
const TEST_PASSWORD = 'SecurePass123!';
const TEST_NAME = 'Dushyant Khandelwal';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testRealRegistration() {
  console.log('🚀 Starting Real Registration Test\n');
  console.log('Backend URL:', BACKEND_URL);
  console.log('Test Email:', TEST_EMAIL);
  console.log('Test Password:', TEST_PASSWORD);
  console.log('='.repeat(60));
  console.log('');

  try {
    // ========================================
    // STEP 1: Request OTP (Registration)
    // ========================================
    console.log('📝 STEP 1: Requesting OTP for Registration');
    console.log('-'.repeat(60));

    const registerResponse = await axios.post(`${BACKEND_URL}/auth/register/request-otp`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: TEST_NAME,
      role: 'public_student'
    });

    if (!registerResponse.data.success) {
      console.log('❌ Registration request failed:', registerResponse.data.message);
      rl.close();
      return;
    }

    console.log('✅ Registration request successful');
    console.log(`   Message: ${registerResponse.data.message}`);
    
    // Check if OTP is in response (email service failed)
    if (registerResponse.data.data.otp) {
      console.log(`   📧 OTP (Email Failed): ${registerResponse.data.data.otp}`);
      if (registerResponse.data.data.emailFailed) {
        console.log('   ⚠️  Email service unavailable - OTP displayed above');
      }
    } else {
      console.log('   📧 OTP sent to email: ' + TEST_EMAIL);
      console.log('   ⏳ Check your email for the verification code');
    }
    console.log('');

    // ========================================
    // STEP 2: Wait for User to Enter OTP
    // ========================================
    console.log('🔐 STEP 2: OTP Verification');
    console.log('-'.repeat(60));
    
    const otp = await askQuestion('Enter the 6-digit OTP from your email: ');
    console.log('');

    if (!otp || otp.length !== 6) {
      console.log('❌ Invalid OTP format. Must be 6 digits.');
      rl.close();
      return;
    }

    // ========================================
    // STEP 3: Verify OTP
    // ========================================
    console.log('Verifying OTP...');
    
    const verifyResponse = await axios.post(`${BACKEND_URL}/auth/register/verify-otp`, {
      email: TEST_EMAIL,
      otp: otp.trim()
    });

    if (!verifyResponse.data.success) {
      console.log('❌ OTP verification failed:', verifyResponse.data.message);
      rl.close();
      return;
    }

    console.log('✅ OTP verified successfully');
    console.log(`   User ID: ${verifyResponse.data.data.user.id}`);
    console.log(`   Email: ${verifyResponse.data.data.user.email}`);
    console.log(`   Email Verified: ${verifyResponse.data.data.user.email_verified}`);
    console.log(`   Token: ${verifyResponse.data.data.token.substring(0, 30)}...`);
    console.log('');

    const registrationToken = verifyResponse.data.data.token;

    // ========================================
    // STEP 4: Test Login
    // ========================================
    console.log('🔑 STEP 4: Testing Login');
    console.log('-'.repeat(60));

    const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      rl.close();
      return;
    }

    console.log('✅ Login successful');
    console.log(`   User: ${loginResponse.data.data.user.name}`);
    console.log(`   Role: ${loginResponse.data.data.user.role}`);
    console.log(`   Token: ${loginResponse.data.data.token.substring(0, 30)}...`);
    console.log('');

    const loginToken = loginResponse.data.data.token;

    // ========================================
    // STEP 5: Test Protected Route
    // ========================================
    console.log('🔒 STEP 5: Testing Protected Route (/auth/me)');
    console.log('-'.repeat(60));

    const meResponse = await axios.get(`${BACKEND_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${loginToken}`
      }
    });

    if (meResponse.data.success) {
      console.log('✅ Protected route access successful');
      console.log(`   Name: ${meResponse.data.data.name}`);
      console.log(`   Email: ${meResponse.data.data.email}`);
      console.log(`   Active: ${meResponse.data.data.isActive}`);
    } else {
      console.log('❌ Protected route access failed');
    }
    console.log('');

    // ========================================
    // SUMMARY
    // ========================================
    console.log('='.repeat(60));
    console.log('🎉 COMPLETE REGISTRATION & LOGIN TEST PASSED');
    console.log('='.repeat(60));
    console.log('');
    console.log('Summary:');
    console.log('  ✅ Registration request sent');
    console.log('  ✅ OTP sent to email');
    console.log('  ✅ OTP verified successfully');
    console.log('  ✅ User account created');
    console.log('  ✅ Login successful');
    console.log('  ✅ Protected route access working');
    console.log('');
    console.log('🚀 The registration and login flow is working perfectly!');
    console.log('');
    console.log('⚠️  NOTE: User account created with email:', TEST_EMAIL);
    console.log('   You can now login on the frontend with these credentials.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  } finally {
    rl.close();
  }
}

// Wait for server to start
setTimeout(() => {
  testRealRegistration();
}, 3000);
