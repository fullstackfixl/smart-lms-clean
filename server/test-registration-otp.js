const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testRegistration() {
  try {
    console.log('Testing registration OTP...');
    
    const response = await axios.post(`${API_URL}/auth/register/request-otp`, {
      email: 'test@example.com',
      password: 'Test1234',
      name: 'Test User',
      role: 'public_student'
    }, {
      timeout: 10000
    });
    
    console.log('✅ Registration OTP Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.otp) {
      console.log('✅ OTP:', response.data.otp);
      return response.data.otp;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testRegistration();
