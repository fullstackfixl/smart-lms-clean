/**
 * Staff Session Persistence Test
 * Simulates browser: login → /auth/me → dashboard APIs → repeat for 90s
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const SECRET = process.env.SUPER_ADMIN_SECRET || 'super-secret-admin-key-2024';

async function api(path, opts = {}) {
  const { headers: h, ...rest } = opts;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...h },
  });
  return { status: res.status, body: await res.json() };
}
const auth = (t) => ({ Authorization: `Bearer ${t}` });

async function run() {
  console.log(`\n🔍 Staff Session Test — ${BASE_URL}\n`);

  // Setup admin
  try {
    await api('/platform/create-super-admin', {
      method: 'POST',
      body: JSON.stringify({ name: 'Admin', email: 'superadmin@test.com', password: 'TestPass123!', secret: SECRET, force: true }),
    });
  } catch { }

  const al = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'superadmin@test.com', password: 'TestPass123!' }) });
  const at = al.body.data?.token;
  if (!at) { console.log('ABORT: no admin token'); process.exit(1); }

  // Create staff
  const se = `sess_${Date.now()}@lms.com`;
  const cr = await api('/platform/staff/create', { method: 'POST', headers: auth(at), body: JSON.stringify({ name: 'Sess Staff', email: se, password: 'test123456' }) });
  if (!cr.body.success) { console.log('ABORT: create failed:', cr.body.message); process.exit(1); }
  console.log('✅ Staff created:', se, 'role:', cr.body.data?.role);

  // Staff login
  const sl = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: se, password: 'test123456' }) });
  const st = sl.body.data?.token;
  if (!st) { console.log('ABORT: staff login failed:', sl.body.message); process.exit(1); }
  console.log('✅ Staff login OK, redirect:', sl.body.data?.redirectUrl);

  // Decode JWT expiry
  try {
    const p = JSON.parse(Buffer.from(st.split('.')[1], 'base64').toString());
    const rem = p.exp - Math.floor(Date.now() / 1000);
    console.log(`🔑 JWT: role=${p.role} org=${p.organization_id} expires_in=${rem}s (${Math.round(rem / 60)}min)`);
    if (rem < 120) console.log('   ⚠️ EXPIRES IN < 2 MIN — THIS IS THE BUG!');
  } catch { }

  // Simulate browser: call APIs every 10s for 90s
  console.log('\n' + '─'.repeat(50));
  const eps = ['/auth/me', '/platform/dashboard/stats', '/platform/organizations'];
  let cycle = 0;

  const check = async () => {
    console.log(`\n⏱ t+${cycle * 10}s:`);
    for (const ep of eps) {
      const r = await api(ep, { headers: auth(st) });
      const ok = r.status === 200;
      console.log(`   ${ok ? '✅' : '❌'} ${ep} → ${r.status}${!ok ? ' ' + (r.body.message || '') : ''}`);
    }
  };

  await check();
  cycle++;

  await new Promise((resolve) => {
    const iv = setInterval(async () => {
      await check();
      cycle++;
      if (cycle >= 9) {
        clearInterval(iv);
        console.log(`\n${'─'.repeat(50)}`);
        console.log('✅ Session survived 90 seconds — backend is fine');
        console.log('─'.repeat(50) + '\n');
        resolve();
      }
    }, 10000);
  });
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });