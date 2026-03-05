
/**
 * Verification Test: All Organization Creation Flows
 * Tests that College orgs get correct modules & email across all 3 flows
 */
const BASE_URL = 'http://localhost:5000';
const SUPER_ADMIN_SECRET = 'super-secret-admin-key-2024';
const ts = Date.now();

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
        const msg = data.message || JSON.stringify(data);
        throw new Error(`HTTP ${res.status} on ${path}: ${msg}`);
    }
    return data;
}

async function verifyFullFlow() {
    try {
        console.log('🚀 Verifying Organization Management and COLLEGE Features...');

        // 1. Setup & Login as Super Admin
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
        const adminToken = loginRes.data.token;
        const headers = { Authorization: `Bearer ${adminToken}` };

        // ─── TEST 1: Direct Creation ─────────────────────────────────
        console.log('\n─── TEST 1: Direct Platform Admin Creation (COLLEGE) ───');
        const directRes = await api('/platform/organizations', {
            method: 'POST',
            body: {
                name: `Direct College ${ts}`,
                subdomain: `direct-college-${ts}`,
                adminEmail: `directadmin${ts}@example.com`,
                adminName: 'Direct Admin',
                password: 'Password123!',
                type: 'COLLEGE'
            },
            headers
        });
        const directOrg = directRes.data.organization || directRes.data;
        console.log('  Type:', directOrg.type);
        console.log('  Email:', directOrg.email);
        console.log('  Modules:', JSON.stringify(directOrg.modulesEnabled));
        if (!directOrg.email) throw new Error('FAIL: Organization missing email');
        if (!directOrg.modulesEnabled?.includes('DEPARTMENTS')) throw new Error('FAIL: Missing DEPARTMENTS module');
        console.log('✅ TEST 1 PASSED');

        // ─── TEST 2: Application Flow (Path the USER reported as broken) ──
        console.log('\n─── TEST 2: Application → Approve → Set Password (COLLEGE) ───');
        const appEmail = `appadmin${ts}@example.com`;
        const appSubdomain = `app-college-${ts}`;

        console.log('  Step: Submitting application...');
        const appRes = await api('/auth/apply-organization', {
            method: 'POST',
            body: {
                organizationName: `App College ${ts}`,
                subdomain: appSubdomain,
                adminName: 'App Admin',
                adminEmail: appEmail,
                selectedPlan: 'basic',
                organizationType: 'COLLEGE'
            }
        });
        const appId = appRes.data._id || appRes.data.id;
        console.log('  App ID:', appId);

        console.log('  Step: Approving application...');
        const approveRes = await api(`/platform/applications/${appId}/approve`, { method: 'PUT', headers });
        const approvalToken = approveRes.data.token;
        console.log('  Token received:', !!approvalToken);
        console.log('  Modules in approval response:', JSON.stringify(approveRes.data.modulesEnabled));

        console.log('  Step: Completing registration (this was giving 400)...');
        const completeRes = await api('/auth/complete-organization-registration', {
            method: 'POST',
            body: { token: approvalToken, password: 'Password123!' }
        });

        console.log('  Full response keys:', Object.keys(completeRes.data || {}));
        const finalOrg = completeRes.data?.organization;
        const finalUser = completeRes.data?.user;

        console.log('  User:', finalUser?.email, 'Role:', finalUser?.role);
        console.log('  Org type:', finalOrg?.type);
        console.log('  Org email:', finalOrg?.email);
        console.log('  Org modules:', JSON.stringify(finalOrg?.modulesEnabled));

        if (!finalOrg?.email) throw new Error('FAIL: Organization missing email in registration response');
        if (!finalOrg?.modulesEnabled?.includes('DEPARTMENTS')) throw new Error('FAIL: Missing DEPARTMENTS module in registration response');
        console.log('✅ TEST 2 PASSED — 400 error is fixed!');

        // ─── TEST 3: Invitation Flow ─────────────────────────────────
        console.log('\n─── TEST 3: Platform Admin Invitation Flow (COLLEGE) ───');
        const inviteRes = await api('/api/platform/organizations/create', {
            method: 'POST',
            body: {
                orgName: `Invite College ${ts}`,
                orgType: 'COLLEGE',
                adminName: 'Invite Admin',
                adminEmail: `inviteadmin${ts}@example.com`
            },
            headers
        });
        const inviteOrgId = inviteRes.data?.organization?.id || inviteRes.data?.organization?._id;
        if (!inviteOrgId) throw new Error('FAIL: No org ID returned from invite creation');

        const inviteDetailRes = await api(`/platform/organizations/${inviteOrgId}`, { headers });
        const inviteOrg = inviteDetailRes.data?.organization || inviteDetailRes.data;
        console.log('  Type:', inviteOrg.type);
        console.log('  Email:', inviteOrg.email);
        console.log('  Modules:', JSON.stringify(inviteOrg.modulesEnabled));
        if (!inviteOrg.email) throw new Error('FAIL: Invited org missing email');
        if (!inviteOrg.modulesEnabled?.includes('DEPARTMENTS')) throw new Error('FAIL: Missing DEPARTMENTS module in invite org');
        console.log('✅ TEST 3 PASSED');

        console.log('\n✨ ALL TESTS PASSED — College Dashboard features are ready!');
        console.log('   The 400 "Contact email is required" error is fixed.');
        console.log('   Module seeding works for both creation paths.');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Verification Failed!');
        console.error('   Error:', error.message);
        process.exit(1);
    }
}

verifyFullFlow();
