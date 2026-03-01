const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAPI() {
    console.log('🚀 Starting API Verification...\n');

    const tests = [
        { name: 'Server Root', endpoint: '/' },
        { name: 'API Health', endpoint: '/api/health' },
        { name: 'Public Courses', endpoint: '/api/courses' }
    ];

    for (const test of tests) {
        try {
            console.log(`📡 Testing: ${test.name} (${test.endpoint})`);
            const response = await axios.get(`${BASE_URL}${test.endpoint}`);
            if (response.status === 200) {
                console.log(`✅ ${test.name}: SUCCESS (200 OK)`);
                console.log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 100)}...`);
            } else {
                console.log(`⚠️ ${test.name}: UNEXPECTED STATUS (${response.status})`);
            }
        } catch (error) {
            console.log(`❌ ${test.name}: FAILED`);
            if (error.response) {
                console.log(`   Error Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else {
                console.log(`   Error Message: ${error.message}`);
            }
        }
        console.log('');
    }

    console.log('🏁 API Verification Complete.');
}

// Wait for server to be fully ready if needed
setTimeout(testAPI, 2000);
