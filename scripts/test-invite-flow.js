/**
 * End-to-End Invitation Flow Test
 * Tests the full platform admin invitation flow for org admins
 *
 * Run against local:  node scripts/test-invite-flow.js
 * Run against prod:   BASE_URL=https://smart-lms-clean-1.onrender.com node scripts/test-invite-flow.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET || 'super-secret-admin-key-2024';
const ts = Date.now();

let passed = 0;
let failed = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

    let data;
    try { data = await res.json(); } catch { data = {}; }

    if (!res.ok) {
        const msg = data.message || JSON.stringify(data);
        throw new Error(`[HTTP ${res.status}] ${path} — ${msg}`);
    }
    return data;
}

function ok(label, condition, detail = '') {
    if (condition) {
        console.log(`  ✅ ${label}${detail ? ` (${detail})` : ''}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${label}${detail ? ` — got: ${detail}` : ''}`);
        failed++;
    }
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

async function runTests() {
    console.log(`\n🚀 Smart LMS — Invitation Flow Test`);
    console.log(`   Target: ${BASE_URL}\n`);

    // ── Setup: get a platform admin token ───────────────────────────────────────
    console.log('📋 Setup: Creating super admin and logging in...');
    try {
        await api('/platform/create-super-admin', {
            method: 'POST',
            body: {
                name: 'Super Admin',
                email: 'superadmin@test.com',
                password: 'TestPass123!',
                secret: SUPER_ADMIN_SECRET,
                force: true
            }
        });
    } catch (e) {
        // might already exist — that's OK
        if (!e.message.includes('already')) {
            console.error('  ⚠️ Could not create super admin:', e.message);
        }
    }

    const loginRes = await api('/auth/login', {
        method: 'POST',
        body: { email: 'superadmin@test.com', password: 'TestPass123!' }
    });

    const adminToken = loginRes.data?.token;
    ok('Platform admin login', !!adminToken, adminToken ? 'token received' : 'NO TOKEN');
    if (!adminToken) {
        console.error('\n❌ Cannot continue without admin token. Aborting.\n');
        process.exit(1);
    }

    const headers = { Authorization: `Bearer ${adminToken}` };

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 1: Create organization with invitation (COLLEGE type)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n─── TEST 1: Platform Admin sends invitation (COLLEGE) ───');
    const orgName = `Test College ${ts}`;
    const orgEmail = `org${ts}@testcollege.edu`;

    const createRes = await api('/api/platform/organizations/create', {
        method: 'POST',
        body: {
            orgName,
            orgType: 'COLLEGE',
            adminName: 'College Admin',
            adminEmail: orgEmail
        },
        headers
    });

    const orgId = createRes.data?.organization?.id || createRes.data?.organization?._id;
    const setupLink = createRes.data?.setupLink;

    ok('Org created', !!orgId, orgId);
    ok('Setup link returned', !!setupLink, setupLink);
    ok('Email sent or link available', !!setupLink);

    // Extract token from setup link (for local testing — no real email needed)
    const inviteToken = setupLink ? new URL(setupLink).searchParams.get('token') : null;
    ok('Invite token in setup link', !!inviteToken, inviteToken?.substring(0, 16) + '...');

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 2: Org admin verifies their invite token (no auth required)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n─── TEST 2: Org admin clicks invitation link → verifyToken ───');
    if (!inviteToken) {
        console.log('  ⚠️  Skipping — no invite token available');
    } else {
        const verifyRes = await api(`/api/platform/org-invite/verify?token=${inviteToken}`);
        ok('Token verified (no auth)', verifyRes.success, verifyRes.success ? 'success' : verifyRes.message);
        ok('Org name returned', !!verifyRes.data?.organization?.name, verifyRes.data?.organization?.name);
        ok('Org type returned', !!verifyRes.data?.organization?.type, verifyRes.data?.organization?.type);
        ok('Type is COLLEGE', verifyRes.data?.organization?.type === 'COLLEGE', verifyRes.data?.organization?.type);
        ok('User name returned', !!verifyRes.data?.user?.name, verifyRes.data?.user?.name);

        // ─────────────────────────────────────────────────────────────────────────
        // TEST 3: Org admin completes setup (sets password)
        // ─────────────────────────────────────────────────────────────────────────
        console.log('\n─── TEST 3: Org admin sets password → completeSetup ───');
        const setupRes = await api('/api/platform/org-invite/complete', {
            method: 'POST',
            body: {
                token: inviteToken,
                password: 'OrgPass123!',
                address: '123 College Street, City',
                phone: '+1234567890'
            }
        });
        ok('Setup completed', setupRes.success, setupRes.success ? 'success' : setupRes.message);
        ok('Org data in response', !!setupRes.data?.organization, JSON.stringify(setupRes.data?.organization));
        ok('Org type correct', setupRes.data?.organization?.type === 'COLLEGE', setupRes.data?.organization?.type);
        ok('Modules seeded', (setupRes.data?.organization?.modulesEnabled?.length || 0) > 0,
            setupRes.data?.organization?.modulesEnabled?.join(', '));
        ok('Has DEPARTMENTS module', setupRes.data?.organization?.modulesEnabled?.includes('DEPARTMENTS'));
        ok('Redirect URL returned', setupRes.data?.redirectUrl === '/login', setupRes.data?.redirectUrl);

        // ─────────────────────────────────────────────────────────────────────────
        // TEST 4: Org admin can now log in
        // ─────────────────────────────────────────────────────────────────────────
        console.log('\n─── TEST 4: Org admin logs in after setup ───');
        const orgLoginRes = await api('/auth/login', {
            method: 'POST',
            body: { email: orgEmail, password: 'OrgPass123!' }
        });

        ok('Login succeeds', orgLoginRes.success, orgLoginRes.success ? 'success' : orgLoginRes.message);
        ok('Token returned', !!orgLoginRes.data?.token);
        ok('Role is org_admin', orgLoginRes.data?.user?.role === 'org_admin', orgLoginRes.data?.user?.role);
        ok('Organization returned', !!orgLoginRes.data?.organization, JSON.stringify(orgLoginRes.data?.organization));
        ok('Org type is COLLEGE', orgLoginRes.data?.organization?.type === 'COLLEGE', orgLoginRes.data?.organization?.type);
        ok('Has DEPARTMENTS module in login', orgLoginRes.data?.organization?.modulesEnabled?.includes('DEPARTMENTS'));

        // ─────────────────────────────────────────────────────────────────────────
        // TEST 5: Re-using the same token fails (already used)
        // ─────────────────────────────────────────────────────────────────────────
        console.log('\n─── TEST 5: Reusing expired/used invite token fails ───');
        try {
            await api(`/api/platform/org-invite/verify?token=${inviteToken}`);
            ok('Reuse correctly rejected (should have thrown)', false, 'did NOT reject');
        } catch (e) {
            ok('Reuse correctly rejected', e.message.includes('401') || e.message.includes('410'),
                e.message.substring(0, 80));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 6: Verify org details via platform admin
    // ─────────────────────────────────────────────────────────────────────────────
    if (orgId) {
        console.log('\n─── TEST 6: Platform admin verifies org details ───');
        const orgDetailRes = await api(`/platform/organizations/${orgId}`, { headers });
        const orgDetail = orgDetailRes.data?.organization || orgDetailRes.data;
        ok('Org retrievable', !!orgDetail, orgDetail?.name);
        ok('Type is COLLEGE', orgDetail?.type === 'COLLEGE', orgDetail?.type);
        ok('Status is active', orgDetail?.status === 'active', orgDetail?.status);
        ok('Email is set', !!orgDetail?.email, orgDetail?.email);
        ok('Modules seeded', (orgDetail?.modulesEnabled?.length || 0) > 0,
            orgDetail?.modulesEnabled?.join(', '));
    }

    // ─── Summary ───────────────────────────────────────────────────────────────
    console.log('\n' + '─'.repeat(55));
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

    if (failed === 0) {
        console.log('✨ ALL TESTS PASSED — Invitation flow works correctly!');
        console.log('   ✅ Invite token verification works (no auth required)');
        console.log('   ✅ Password setup activates org + admin account');
        console.log('   ✅ Login returns correct COLLEGE org type + modules');
        console.log('   ✅ Used/expired tokens are correctly rejected');
    } else {
        console.log(`❌ ${failed} test(s) failed — see above for details`);
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('\n💥 Unexpected error:', err.message);
    process.exit(1);
});
