const axios = require('axios');

const BASE_URL = process.env.API_URL || 'https://smart-lms-clean-1.onrender.com';

async function testRegistrationOTP() {
  console.log('🧪 Testing Registration OTP Endpoint');
  console.log('=====================================\n');

  try {
    const testEmail = `test${Date.now()}@example.com`;
    console.log(`📧 Test Email: ${testEmail}`);
    console.log(`🌐 API URL: ${BASE_URL}/auth/register/request-otp\n`);

    const response = await axios.post(`${BASE_URL}/auth/register/request-otp`, {
      email: testEmail,
      password: 'TestPassword123!',
      name: 'Test User',
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
      if (response.data.otp) {
        console.log(`🔐 OTP: ${response.data.otp}`);
      }
    } else {
      console.log('\n❌ FAILED: OTP request failed');
      console.log(`Error: ${response.data.error || response.data.message}`);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testRegistrationOTP();
