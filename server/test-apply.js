const axios = require('axios');

async function testApply() {
    console.log('🚀 Probing /auth/apply-organization...');
    try {
        const response = await axios.post('http://localhost:5000/auth/apply-organization', {
            organizationName: 'Test Org',
            adminName: 'Test Admin',
            adminEmail: 'test@example.com',
            selectedPlan: 'basic',
            organizationType: 'SCHOOL'
        });
        console.log('✅ Success:', response.status, response.data);
    } catch (error) {
        if (error.response) {
            console.log('❌ Rejected by server:', error.response.status, error.response.data);
        } else {
            console.log('❌ Connection failed:', error.message);
        }
    }
}

testApply();
