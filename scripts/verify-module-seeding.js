
const BASE_URL = 'http://localhost:5000';
const SUPER_ADMIN_SECRET = 'super-secret-admin-key-2024';

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
        throw new Error(data.message || `HTTP error! status: ${res.status}`);
    }
    return data;
}

async function verifyModuleSeeding() {
    try {
        console.log('🚀 Verifying Module Seeding for COLLEGE type...');

        // 1. Setup & Login
        await api('/platform/create-super-admin', {
            method: 'POST',
            body: {
                name: 'Super Admin',
                email: 'superadmin@example.com',
                password: 'Password123!',
                secret: SUPER_ADMIN_SECRET,
                force: true
            }
        });

        const loginRes = await api('/auth/login', {
            method: 'POST',
            body: { email: 'superadmin@example.com', password: 'Password123!' }
        });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Create College Org via Direct Flow
        console.log('Step: Creating College Org via Direct Flow...');
        const collegeData = {
            name: 'Test College ' + Date.now(),
            subdomain: 'testcollege' + Math.floor(Math.random() * 10000),
            adminEmail: 'collegeadmin' + Date.now() + '@example.com',
            adminName: 'College Admin',
            password: 'Password123!',
            type: 'COLLEGE'
        };

        const createRes = await api('/platform/organizations', {
            method: 'POST',
            body: collegeData,
            headers
        });

        const createdOrg = createRes.data.organization || createRes.data;
        console.log('✅ Organization created. Type:', createdOrg.type);
        console.log('   Modules Enabled:', JSON.stringify(createdOrg.modulesEnabled));

        if (createdOrg.modulesEnabled && createdOrg.modulesEnabled.includes('DEPARTMENTS')) {
            console.log('✨ SUCCESS: College modules seeded correctly!');
        } else {
            throw new Error('College modules NOT seeded in direct flow');
        }

        // 3. Create College Org via Invite Flow
        console.log('\nStep: Creating College Org via Invite Flow...');
        const inviteData = {
            orgName: 'Invite College ' + Date.now(),
            orgType: 'COLLEGE',
            adminName: 'Invite Admin',
            adminEmail: 'inviteadmin' + Date.now() + '@example.com'
        };

        const inviteRes = await api('/api/platform/organizations/create', {
            method: 'POST',
            body: inviteData,
            headers
        });

        // We need to fetch the organization details to see modules
        const orgId = inviteRes.data.organization.id;
        const detailsRes = await api(`/platform/organizations/${orgId}`, { headers });
        const detailOrg = detailsRes.data.organization || detailsRes.data;

        console.log('✅ Organization created (Invite). Type:', detailOrg.type);
        console.log('   Modules Enabled:', JSON.stringify(detailOrg.modulesEnabled));

        if (detailOrg.modulesEnabled && detailOrg.modulesEnabled.includes('DEPARTMENTS')) {
            console.log('✨ SUCCESS: College modules seeded correctly in invite flow!');
        } else {
            throw new Error('College modules NOT seeded in invite flow');
        }

        console.log('\n✅ ALL MODULE SEEDING TESTS PASSED!');

    } catch (error) {
        console.error('\n❌ Verification Failed!');
        console.error(error.message);
        process.exit(1);
    }
}

verifyModuleSeeding();
