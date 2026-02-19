const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testRegistrationOTP() {
  console.log('🧪 Testing Registration OTP Endpoint (Local)');
  console.log('=============================================\n');

  try {
    const testEmail = `test${Date.now()}@example.com`;
    console.log(`📧 Test Email: ${testEmail}`);
    console.log(`🌐 API URL: ${BASE_URL}/auth/register/request-otp\n`);

    const response = await axios.post(`${BASE_URL}/auth/register/request-otp`, {
      email: 'dushyantkhandelwal4665@gmail.com',
      password: 'TestPassword123!',
      name: 'Dushyant Khandelwal',
      role: 'public_student'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // Don't throw on any status
    });

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📦 Response Data:`, JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log('\n✅ SUCCESS: OTP request successful');
      if (response.data.data && response.data.data.otp) {
        console.log(`🔐 OTP: ${response.data.data.otp}`);
        console.log(`📧 Email Failed: ${response.data.data.emailFailed || false}`);
      }
    } else {
      console.log('\n❌ FAILED: OTP request failed');
      console.log(`Error: ${response.data.error || response.data.message}`);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Error stack:', error.stack);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server is not running. Please start the server with: npm run dev');
    }
  }
}

testRegistrationOTP();
