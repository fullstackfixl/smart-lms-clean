const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';

async function testRoutes() {
    console.log('🚀 Starting COMPREHENSIVE API & CONNECTIVITY Verification...\n');

    const tests = [
        { name: 'Root Health', endpoint: '/', method: 'GET' },
        { name: 'API Health', endpoint: '/api/health', method: 'GET' },
        { name: 'Auth Login (Probe)', endpoint: '/auth/login', method: 'POST', data: { email: 'test@example.com', password: 'password' } },
        { name: 'Apply Org (Probe)', endpoint: '/auth/apply-organization', method: 'POST', data: { organizationName: 'Test', adminName: 'A', adminEmail: 'a@a.com', selectedPlan: 'basic', organizationType: 'SCHOOL' } },
        { name: 'Public Courses', endpoint: '/api/courses', method: 'GET' },
        { name: 'Organizations', endpoint: '/api/organizations', method: 'GET' },
        { name: 'Analytics Dashboard', endpoint: '/api/analytics/dashboard', method: 'GET' },
        { name: 'Payments Razorpay', endpoint: '/api/payments/razorpay/create-order', method: 'POST', data: {} },
        { name: 'Upload Local', endpoint: '/api/upload/local', method: 'POST', data: {} },
        { name: 'Quizzes Student', endpoint: '/api/quizzes/student', method: 'GET' },
        { name: 'Student Lectures', endpoint: '/student', method: 'GET' }
    ];

    let successCount = 0;
    let failCount = 0;

    for (const test of tests) {
        try {
            console.log(`📡 Testing: ${test.name} [${test.method} ${test.endpoint}]`);

            const config = {
                method: test.method,
                url: `${BASE_URL}${test.endpoint}`,
                headers: {
                    'Origin': FRONTEND_URL,
                    'Content-Type': 'application/json'
                },
                data: test.data
            };

            const response = await axios(config);

            console.log(`✅ ${test.name}: SUCCESS (${response.status})`);
            successCount++;
        } catch (error) {
            if (error.response) {
                // If we get 401, 403, or 400, the route IS loaded and working, just rejected for lack of auth/data
                if ([400, 401, 403, 405].includes(error.response.status)) {
                    console.log(`✅ ${test.name}: REACHABLE (${error.response.status} - ${error.response.data.message || 'Expected rejection'})`);
                    successCount++;
                } else if (error.response.status === 404) {
                    console.log(`❌ ${test.name}: NOT FOUND (404)`);
                    failCount++;
                } else {
                    console.log(`❌ ${test.name}: SERVER ERROR (${error.response.status})`);
                    failCount++;
                }
            } else {
                console.log(`❌ ${test.name}: CONNECTION FAILED - ${error.message}`);
                failCount++;
            }
        }
        console.log('');
    }

    console.log('-------------------------------------------');
    console.log(`🏁 Summary: ${successCount} PASSED, ${failCount} FAILED`);
    console.log('-------------------------------------------');

    if (failCount > 0) {
        process.exit(1);
    }
}

testRoutes();
