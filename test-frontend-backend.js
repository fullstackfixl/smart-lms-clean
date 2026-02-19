const axios = require('axios');

const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3001';

async function testEndpoints() {
  console.log('🧪 Testing Frontend-Backend Connection\n');
  
  const tests = [
    {
      name: 'Health Check',
      method: 'GET',
      url: `${BACKEND_URL}/api/health`
    },
    {
      name: 'Registration OTP',
      method: 'POST',
      url: `${BACKEND_URL}/auth/register/request-otp`,
      data: {
        email: 'test@example.com',
        password: 'Test1234',
        name: 'Test User',
        role: 'public_student'
      }
    },
    {
      name: 'Public Courses',
      method: 'GET',
      url: `${BACKEND_URL}/api/public/courses`
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`\n📡 Testing: ${test.name}`);
      console.log(`   ${test.method} ${test.url}`);
      
      const config = {
        method: test.method,
        url: test.url,
        timeout: 10000
      };
      
      if (test.data) {
        config.data = test.data;
      }
      
      const response = await axios(config);
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ✅ Success: ${response.data.success}`);
      if (response.data.message) {
        console.log(`   ✅ Message: ${response.data.message}`);
      }
      passed++;
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      if (error.response) {
        console.log(`   ❌ Status: ${error.response.status}`);
        console.log(`   ❌ Error: ${JSON.stringify(error.response.data)}`);
      }
      failed++;
    }
  }

  console.log(`\n\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All endpoints working!');
  } else {
    console.log('❌ Some endpoints failed');
  }
}

testEndpoints();
