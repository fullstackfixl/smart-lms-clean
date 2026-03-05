
const BASE_URL = 'http://localhost:5000';
const SUPER_ADMIN_SECRET = 'super-secret-admin-key-2024';

const testData = {
    admin: {
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: 'Password123!',
        secret: SUPER_ADMIN_SECRET,
        force: true
    }
};

let token = '';

async function api(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json();
    if (!res.ok) {
        const error = new Error(data.message || `HTTP error! status: ${res.status}`);
        error.response = { status: res.status, data };
        throw error;
    }
    return data;
}

async function runTests() {
    try {
        console.log('🚀 Starting Full Platform Admin Verification...');

        // 1. Setup & Login
        console.log('\n--- AUTHENTICATION ---');
        await api('/platform/create-super-admin', { method: 'POST', body: testData.admin });
        const loginRes = await api('/auth/login', {
            method: 'POST',
            body: { email: testData.admin.email, password: testData.admin.password }
        });
        token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Auth successful');

        // 2. Dashboard & Analytics
        console.log('\n--- DASHBOARD & ANALYTICS ---');
        const dbStats = await api('/platform/dashboard/stats', { headers });
        console.log('✅ Dashboard Stats:', dbStats.success ? 'Retrieved' : 'FAILED');

        const globalAnalytics = await api('/platform/analytics/global', { headers });
        console.log('✅ Global Analytics:', globalAnalytics.success ? 'Retrieved' : 'FAILED');

        // 3. Organizations Stats (Extended)
        console.log('\n--- ORGANIZATIONS ---');
        const orgStats = await api('/platform/organizations/stats', { headers });
        console.log('✅ Org Stats breakdown:', JSON.stringify(orgStats.data.stats));

        // 4. Applications
        console.log('\n--- APPLICATIONS ---');
        const apps = await api('/platform/applications?status=pending', { headers });
        console.log('✅ Pending Applications:', Array.isArray(apps.data) || apps.data.applications ? 'Retrieved' : 'FAILED');

        // 5. Platform Admins
        console.log('\n--- PLATFORM ADMINS ---');
        const admins = await api('/platform/admins', { headers });
        console.log('✅ Admins List:', (admins.data.admins || Array.isArray(admins.data)) ? 'Retrieved' : 'FAILED');

        // 6. Courses Platform Review
        console.log('\n--- COURSES ---');
        const courses = await api('/platform/courses', { headers });
        console.log('✅ Courses List:', (courses.data.courses || Array.isArray(courses.data)) ? 'Retrieved' : 'FAILED');

        const courseStats = await api('/platform/courses/stats', { headers });
        console.log('✅ Course Stats:', courseStats.data ? 'Retrieved' : 'FAILED');

        console.log('\n✨ ALL PLATFORM ADMIN ENDPOINTS VERIFIED! ✨');

    } catch (error) {
        console.error('\n❌ Test Failed!');
        if (error.response) {
            console.error('Response Error:', error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
        }
        process.exit(1);
    }
}

runTests();
