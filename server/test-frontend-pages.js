/**
 * Test Frontend Pages and API Integration
 * Verifies that frontend pages can load and connect to backend
 */

const axios = require('axios');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5000';

async function testFrontendPages() {
  console.log('🌐 Testing Frontend Pages and Backend Connection\n');
  console.log('Frontend URL:', FRONTEND_URL);
  console.log('Backend URL:', BACKEND_URL);
  console.log('='.repeat(60));
  console.log('');

  const tests = [
    { name: 'Home Page', url: '/' },
    { name: 'Login Page', url: '/login' },
    { name: 'Register Page', url: '/register' },
    { name: 'Dashboard Page', url: '/dashboard' }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const response = await axios.get(`${FRONTEND_URL}${test.url}`, {
        timeout: 10000,
        validateStatus: (status) => status < 500 // Accept redirects
      });
      
      if (response.status === 200 || response.status === 307 || response.status === 308) {
        console.log(`✅ ${test.name}: ${response.status}`);
        passed++;
      } else {
        console.log(`⚠️  ${test.name}: ${response.status} (Unexpected)`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failed++;
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');

  // Test API connectivity from frontend perspective
  console.log('🔌 Testing Backend API Connectivity');
  console.log('-'.repeat(60));

  try {
    const healthCheck = await axios.get(`${BACKEND_URL}/api/health`);
    console.log(`✅ Backend Health: ${healthCheck.status} - ${healthCheck.data.message}`);
    console.log(`   CORS: ${healthCheck.data.cors}`);
    console.log(`   Environment: ${healthCheck.data.env}`);
  } catch (error) {
    console.log(`❌ Backend Health: ${error.message}`);
  }

  console.log('');

  // Test CORS from frontend origin
  console.log('🌍 Testing CORS Configuration');
  console.log('-'.repeat(60));

  try {
    const corsTest = await axios.post(`${BACKEND_URL}/auth/login`, 
      { email: 'test@example.com', password: 'test' },
      {
        headers: {
          'Origin': FRONTEND_URL,
          'Content-Type': 'application/json'
        },
        validateStatus: () => true // Accept all status codes
      }
    );
    
    const corsHeader = corsTest.headers['access-control-allow-origin'];
    if (corsHeader) {
      console.log(`✅ CORS Header Present: ${corsHeader}`);
    } else {
      console.log(`❌ CORS Header Missing`);
    }
    
    const credentialsHeader = corsTest.headers['access-control-allow-credentials'];
    if (credentialsHeader === 'true') {
      console.log(`✅ CORS Credentials Allowed: ${credentialsHeader}`);
    } else {
      console.log(`⚠️  CORS Credentials: ${credentialsHeader || 'not set'}`);
    }
  } catch (error) {
    console.log(`❌ CORS Test Failed: ${error.message}`);
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('✅ Frontend-Backend Integration Test Complete');
  console.log('='.repeat(60));
}

testFrontendPages().catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});
