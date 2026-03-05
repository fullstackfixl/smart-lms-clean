
const BASE_URL = 'http://localhost:5000';
const SUPER_ADMIN_SECRET = 'super-secret-admin-key-2024';

const testData = {
    admin: {
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: 'Password123!',
        secret: SUPER_ADMIN_SECRET,
        force: true
    },
    org: {
        name: 'Test Organization ' + Date.now(),
        subdomain: 'testorg' + Math.floor(Math.random() * 10000),
        email: 'org' + Date.now() + '@example.com', // Added email field for organization
        adminEmail: 'orgadmin' + Date.now() + '@example.com',
        adminName: 'Org Admin',
        password: 'Password123!',
        plan: 'premium', // Test premium plan
        type: 'SCHOOL'
    }
};

let token = '';
let orgId = '';

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
        console.log('🚀 Starting Platform Admin CRUD Verification...');

        // 1. Create/Reset Super Admin
        console.log('Step 1: Creating/Resetting Super Admin...');
        const setupRes = await api('/platform/create-super-admin', {
            method: 'POST',
            body: testData.admin
        });
        console.log('✅ Super Admin setup response:', setupRes.message);

        // 2. Login as Super Admin
        console.log('Step 2: Logging in...');
        const loginRes = await api('/auth/login', {
            method: 'POST',
            body: {
                email: testData.admin.email,
                password: testData.admin.password
            }
        });
        token = loginRes.data.token;
        console.log('✅ Login successful. Token acquired.');

        const headers = { Authorization: `Bearer ${token}` };

        // 3. Create Organization
        console.log('Step 3: Creating Organization...');
        const createRes = await api('/platform/organizations', {
            method: 'POST',
            body: testData.org,
            headers
        });

        // Check if the structure is data.organization or just data
        const createdOrg = createRes.data.organization || createRes.data;
        orgId = createdOrg._id;
        console.log('✅ Organization created. ID:', orgId);

        // 4. List Organizations
        console.log('Step 4: Listing Organizations...');
        const listRes = await api('/platform/organizations', { headers });
        const found = listRes.data.organizations.find(o => o._id === orgId);
        if (found) {
            console.log('✅ Organization found in list.');
        } else {
            throw new Error('Created organization not found in list');
        }

        // 5. Get Stats
        console.log('Step 5: Verifying Stats endpoint...');
        const statsRes = await api('/platform/organizations/stats', { headers });
        if (statsRes.success && statsRes.data.stats) {
            console.log('✅ Stats retrieved:', JSON.stringify(statsRes.data.stats));
        } else {
            throw new Error('Stats format incorrect');
        }

        // 6. Get Details
        console.log('Step 6: Getting Org Details...');
        const detailsRes = await api(`/platform/organizations/${orgId}`, { headers });
        const detailData = detailsRes.data.organization || detailsRes.data;
        if (detailData._id === orgId) {
            console.log('✅ Details retrieved correctly.');
        } else {
            throw new Error('Details ID mismatch');
        }

        // 7. Update Organization
        console.log('Step 7: Updating Organization...');
        const updatedName = testData.org.name + ' UPDATED';
        const updateRes = await api(`/platform/organizations/${orgId}`, {
            method: 'PUT',
            body: { name: updatedName },
            headers
        });
        const updatedOrg = updateRes.data.organization || updateRes.data;
        if (updatedOrg.name === updatedName) {
            console.log('✅ Name updated successfully.');
        } else {
            throw new Error('Update name mismatch');
        }

        // 8. Toggle Status (Suspend)
        console.log('Step 8: Suspending Organization...');
        const suspendRes = await api(`/platform/organizations/${orgId}/status`, {
            method: 'PATCH',
            body: { status: 'suspended' },
            headers
        });
        const suspendedOrg = suspendRes.data.organization || suspendRes.data;
        if (suspendedOrg.status === 'suspended') {
            console.log('✅ Status toggled to suspended.');
        } else {
            throw new Error('Suspend status mismatch');
        }

        // 9. Toggle Status (Activate)
        console.log('Step 9: Activating Organization...');
        const activateRes = await api(`/platform/organizations/${orgId}/status`, {
            method: 'PATCH',
            body: { status: 'active' },
            headers
        });
        const activatedOrg = activateRes.data.organization || activateRes.data;
        if (activatedOrg.status === 'active') {
            console.log('✅ Status toggled to active.');
        } else {
            throw new Error('Activate status mismatch');
        }

        // 10. Delete Organization (Soft Delete)
        console.log('Step 10: Deleting Organization...');
        const deleteRes = await api(`/platform/organizations/${orgId}`, {
            method: 'DELETE',
            headers
        });
        const deletedOrg = deleteRes.data.organization || deleteRes.data;
        if (deletedOrg.is_deleted === true) {
            console.log('✅ Organization soft-deleted successfully.');
        } else {
            throw new Error('Delete flag mismatch');
        }

        console.log('\n✨ ALL PLATFORM ADMIN CRUD TESTS PASSED! ✨');

    } catch (error) {
        console.error('\n❌ Test Failed!');
        if (error.response) {
            console.error('Response Error:', error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
            console.error(error.stack);
        }
        process.exit(1);
    }
}

runTests();
