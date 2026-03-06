const BASE_URL = 'http://localhost:5000';
const STAFF_EMAIL = 'staff_test@lms.com';
const STAFF_PASS = 'testpass123';
const ADMIN_EMAIL = 'admin_test@lms.com';
const ADMIN_PASS = 'adminpass123';
const SECRET = 'super-secret-admin-key-2024';

async function api(path, method = 'GET', body = null, token = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, options);
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return res.json();
    }
    return { success: res.ok, status: res.status, text: await res.text() };
}

async function run() {
    console.log('🚀 Starting Staff Session Persistence Test...');

    // 1. Ensure Admin exists
    console.log('👷 Setting up platform admin...');
    const adminSetup = await api('/platform/create-super-admin', 'POST', {
        name: 'Test Admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASS,
        secret: SECRET,
        force: true
    });

    if (!adminSetup.success) {
        console.error('❌ Failed to setup admin:', adminSetup.message || adminSetup.text);
        return;
    }
    console.log('✅ Admin setup OK.');

    // 2. Login as Admin
    const adminLogin = await api('/auth/login', 'POST', {
        email: ADMIN_EMAIL,
        password: ADMIN_PASS
    });

    if (!adminLogin.success) {
        console.error('❌ Admin login failed:', adminLogin.message);
        return;
    }
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin logged in.');

    // 3. Ensure Staff exists
    console.log('👷 Setting up staff user...');
    const staffSetup = await api('/platform/staff/create', 'POST', {
        name: 'Test Staff',
        email: STAFF_EMAIL,
        password: STAFF_PASS
    }, adminToken);

    if (!staffSetup.success && !String(staffSetup.message).includes('already exists')) {
        console.error('❌ Failed to setup staff:', staffSetup.message || staffSetup.text);
        return;
    }
    console.log('✅ Staff setup OK.');

    // 4. Staff Login
    const staffLogin = await api('/auth/login', 'POST', {
        email: STAFF_EMAIL,
        password: STAFF_PASS
    });

    if (!staffLogin.success) {
        console.error('❌ Staff login failed:', staffLogin.message);
        return;
    }
    const token = staffLogin.data.token;
    console.log('✅ Staff logged in. Role:', staffLogin.data.role);

    // Run for 120 seconds (2 minutes)
    const duration = 120;
    const interval = 10; // Every 10 seconds
    let seconds = 0;
    const checkInterval = setInterval(async () => {
        seconds += interval;
        console.log(`⏱ ${seconds}s passed...`);

        try {
            const res = await api('/auth/me', 'GET', null, token);
            if (res.success) {
                console.log(`   ✅ [${seconds}s] /auth/me: OK (Role: ${res.data.user.role})`);
            } else {
                console.log(`   ❌ [${seconds}s] /auth/me: FAILED - ${res.message || res.text}`);
                clearInterval(interval);
                process.exit(1);
            }

            const statsRes = await api('/platform/dashboard/stats', 'GET', null, token);
            if (statsRes.success) {
                console.log(`   ✅ [${seconds}s] /platform/dashboard/stats: OK`);
            } else {
                console.log(`   ❌ [${seconds}s] /platform/dashboard/stats: FAILED - ${statsRes.message || statsRes.text}`);
                clearInterval(interval);
                process.exit(1);
            }
        } catch (e) {
            console.error(`   🔥 [${seconds}s] Error:`, e.message);
            clearInterval(interval);
            process.exit(1);
        }

        if (seconds >= 90) {
            console.log('\n🌟 TEST PASSED: Session stable for 90 seconds.');
            console.log('This confirms the BACKEND is not dropping the session.');
            clearInterval(interval);
            process.exit(0);
        }
    }, 10000);
}

run();
