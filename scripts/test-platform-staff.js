/**
 * Platform Staff Role — End-to-End Test
 *
 * Usage: node scripts/test-platform-staff.js
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET || 'super-secret-admin-key-2024';

async function api(path, opts = {}) {
    const { headers: h, ...rest } = opts;
    const res = await fetch(`${BASE_URL}${path}`, {
        ...rest,
        headers: { 'Content-Type': 'application/json', ...h },
    });
    const data = await res.json();
    return { status: res.status, ...data };
}

const hdr = (t) => ({ Authorization: `Bearer ${t}` });
const STAFF_EMAIL = `staff_test_${Date.now()}@lms.com`;
const STAFF_PW = 'staff123456';

let adminToken = '', staffToken = '', staffId = '';
let passed = 0, failed = 0;

function ok(label, cond) {
    if (cond) { console.log(`   ✅ ${label}`); passed++; }
    else { console.log(`   ❌ ${label}`); failed++; }
}

async function run() {
    console.log('\n🚀 Platform Staff Role E2E Test');
    console.log(`   Target: ${BASE_URL}\n`);

    // 0. Ensure super admin
    try {
        await api('/platform/create-super-admin', {
            method: 'POST',
            body: JSON.stringify({ name: 'Super Admin', email: 'superadmin@test.com', password: 'TestPass123!', secret: SUPER_ADMIN_SECRET, force: true }),
        });
    } catch { }

    // 1. Admin Login
    console.log('1. Admin Login');
    const login = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'superadmin@test.com', password: 'TestPass123!' }),
    });
    adminToken = login.data?.token;
    ok('Admin login', login.success && !!adminToken);
    if (!adminToken) { console.log('ABORT'); process.exit(1); }

    // 2. Create Staff
    console.log('\n2. Create Staff');
    const create = await api('/platform/staff/create', {
        method: 'POST',
        headers: hdr(adminToken),
        body: JSON.stringify({ name: 'Test Staff', email: STAFF_EMAIL, password: STAFF_PW }),
    });
    staffId = create.data?._id;
    ok('Staff created', create.success && !!staffId);
    ok('Role=platform_staff', create.data?.role === 'platform_staff');

    // 3. Duplicate Rejected
    console.log('\n3. Duplicate');
    const dup = await api('/platform/staff/create', {
        method: 'POST',
        headers: hdr(adminToken),
        body: JSON.stringify({ name: 'Dup', email: STAFF_EMAIL, password: STAFF_PW }),
    });
    ok('Duplicate rejected', !dup.success);

    // 4. Staff Login
    console.log('\n4. Staff Login');
    const sl = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: STAFF_EMAIL, password: STAFF_PW }),
    });
    staffToken = sl.data?.token;
    ok('Staff login', sl.success && !!staffToken);
    ok('Redirect=/platform/dashboard', sl.data?.redirectUrl === '/platform/dashboard');
    ok('Role=platform_staff', sl.data?.role === 'platform_staff');

    if (!staffToken) { console.log('SKIP: no staff token'); }

    // 5. Staff shared routes
    console.log('\n5. Shared Routes');
    if (staffToken) {
        for (const [l, p] of [
            ['organizations', '/platform/organizations'],
            ['applications', '/platform/applications'],
            ['courses', '/platform/courses'],
            ['dashboard/stats', '/platform/dashboard/stats'],
            ['analytics', '/platform/analytics/overview'],
        ]) {
            const r = await api(p, { headers: hdr(staffToken) });
            ok(`GET /${l}`, r.status !== 403 && r.status !== 401);
        }
    }

    // 6. Admin-only routes blocked for staff
    console.log('\n6. Admin-Only Blocked');
    if (staffToken) {
        const a1 = await api('/platform/admins', { method: 'POST', headers: hdr(staffToken), body: JSON.stringify({ name: 'x', email: 'x@x.com', password: 'x12345' }) });
        ok('POST /admins → 403', a1.status === 403);

        const a2 = await api('/platform/config', { headers: hdr(staffToken) });
        ok('GET /config → 403', a2.status === 403);

        const a3 = await api('/platform/organizations/000000000000000000000000', { method: 'DELETE', headers: hdr(staffToken) });
        ok('DELETE /orgs → 403', a3.status === 403);
    }

    // 7. Privilege escalation
    console.log('\n7. Escalation Prevention');
    if (staffToken) {
        const e1 = await api('/platform/staff/create', { method: 'POST', headers: hdr(staffToken), body: JSON.stringify({ name: 'Evil', email: 'evil@x.com', password: 'evil12' }) });
        ok('Staff cannot create staff', e1.status === 403);

        const e2 = await api('/platform/staff', { headers: hdr(staffToken) });
        ok('Staff cannot list staff', e2.status === 403);
    }

    // 8. Admin staff management
    console.log('\n8. Admin Staff Mgmt');
    const list = await api('/platform/staff', { headers: hdr(adminToken) });
    ok('Admin lists staff', list.success && Array.isArray(list.data));
    ok('Test staff in list', list.data?.some(s => s.email === STAFF_EMAIL));

    // 9. Activity logs
    console.log('\n9. Logs');
    const logs = await api('/platform/staff/logs', { headers: hdr(adminToken) });
    ok('Admin views logs', logs.success);

    // 10. Suspend staff
    console.log('\n10. Suspend');
    if (staffId) {
        const sus = await api(`/platform/staff/${staffId}/status`, { method: 'PATCH', headers: hdr(adminToken), body: JSON.stringify({ status: 'suspended' }) });
        ok('Suspend OK', sus.success);
        const sl2 = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: STAFF_EMAIL, password: STAFF_PW }) });
        ok('Suspended blocked', !sl2.success);
    }

    // Summary
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`   ${passed} passed, ${failed} failed`);
    console.log(failed === 0 ? '   🎯 ALL TESTS PASSED' : '   ⚠️  Some failed');
    console.log(`${'─'.repeat(50)}\n`);
    process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
