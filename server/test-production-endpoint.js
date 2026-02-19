const axios = require('axios');

const PRODUCTION_URL = 'https://smart-lms-clean-1.onrender.com';

async function testProductionEndpoint() {
  console.log('🧪 Testing Production Registration Endpoint');
  console.log('===========================================\n');

  console.log(`🌐 Production URL: ${PRODUCTION_URL}`);
  console.log(`📧 Test Email: dushyantkhandelwal4665@gmail.com\n`);

  try {
    console.log('📤 Sending registration request...\n');

    const response = await axios.post(`${PRODUCTION_URL}/auth/register/request-otp`, {
      email: 'dushyantkhandelwal4665@gmail.com',
      password: 'TestPassword123!',
      name: 'Dushyant Khandelwal',
      role: 'public_student'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true, // Don't throw on any status
      timeout: 30000 // 30 second timeout
    });

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📦 Response Data:`, JSON.stringify(response.data, null, 2));
    console.log();

    // Analyze response
    if (response.status === 200 && response.data.success) {
      console.log('✅ SUCCESS! Registration endpoint working correctly\n');
      
      if (response.data.data.emailFailed) {
        console.log('⚠️  Email service unavailable (graceful fallback)');
        console.log(`🔐 OTP displayed: ${response.data.data.otp}`);
        console.log('✅ This is acceptable - user can still register\n');
      } else {
        console.log('✅ Email sent successfully');
        if (response.data.data.otp) {
          console.log(`🔐 OTP: ${response.data.data.otp}`);
        }
        console.log('📧 Check your inbox for the verification email\n');
      }

      console.log('🎉 All systems operational!');
      
    } else if (response.status === 400) {
      console.log('⚠️  Expected error (email already registered or validation failed)');
      console.log(`Error: ${response.data.error || response.data.message}`);
      console.log('✅ This is normal behavior\n');
      
    } else if (response.status === 500) {
      console.log('❌ CRITICAL: 500 Internal Server Error');
      console.log('This should NOT happen with the new fix!');
      console.log(`Error: ${response.data.error || response.data.message}\n`);
      console.log('🔧 Action required:');
      console.log('1. Check Render logs');
      console.log('2. Verify environment variables');
      console.log('3. Check email service initialization\n');
      
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
      console.log(`Error: ${response.data.error || response.data.message}\n`);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to production server');
      console.error('Check if the server is running on Render\n');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('❌ Request timeout');
      console.error('Server took too long to respond (> 30 seconds)\n');
    } else if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

console.log('⏳ Waiting for production server to be ready...\n');
setTimeout(testProductionEndpoint, 2000);
