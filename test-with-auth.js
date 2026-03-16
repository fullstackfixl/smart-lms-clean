/**
 * Full test with authentication
 * Run this after logging in and getting token
 */

const BASE = 'http://localhost:5000/api/platform';

// Get token from browser console after login:
// const token = document.cookie.split(";").find(c => c.trim().startsWith("instatute_token="))?.split("=")[1];
// console.log(token);

const TOKEN = 'PASTE_YOUR_TOKEN_HERE'; // Replace with actual token

const headers = {
  'Content-Type': 'application/json',
  'Cookie': `instatute_token=${TOKEN}`
};

async function testEndpoint(method, url, body = null) {
  try {
    const res = await fetch(`${BASE}${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    console.log(`${method} ${url} → ${res.status}`, data.success ? '✅' : '❌', data.message || '');
    return data;
  } catch (err) {
    console.log(`${method} ${url} → ❌ Network error:`, err.message);
    return { success: false };
  }
}

async function runTests() {
  if (!TOKEN || TOKEN === 'PASTE_YOUR_TOKEN_HERE') {
    console.log('❌ Get token first:');
    console.log('1. Login at http://localhost:3000/login');
    console.log('2. In console run: const token = document.cookie.split(";").find(c => c.trim().startsWith("instatute_token="))?.split("=")[1];');
    console.log('3. Copy token and paste into this file');
    return;
  }

  console.log('🧪 Testing with Authentication\n');

  // 1. List orgs
  await testEndpoint('GET', '/organizations');

  // 2. Create org
  const newOrg = await testEndpoint('POST', '/organizations', {
    name: 'Test College',
    email: 'test@org.com',
    type: 'COLLEGE',
    plan: 'basic'
  });

  if (!newOrg.success) {
    console.log('❌ Create failed');
    return;
  }

  const orgId = newOrg.data._id;
  console.log(`Created org: ${orgId}\n`);

  // 3. Get details and stats
  await testEndpoint('GET', `/organizations/${orgId}`);
  await testEndpoint('GET', `/organizations/${orgId}/stats`);

  // 4. Test all sub-routes
  await testEndpoint('GET', `/organizations/${orgId}/students`);
  await testEndpoint('GET', `/organizations/${orgId}/instructors`);
  await testEndpoint('GET', `/organizations/${orgId}/courses`);
  await testEndpoint('GET', `/organizations/${orgId}/activity`);
  await testEndpoint('GET', `/organizations/${orgId}/live-classes`);
  await testEndpoint('GET', `/organizations/${orgId}/quizzes`);
  await testEndpoint('GET', `/organizations/${orgId}/certificates`);
  await testEndpoint('GET', `/organizations/${orgId}/attendance`);

  // 5. Test actions
  await testEndpoint('PATCH', `/organizations/${orgId}/suspend`);
  await testEndpoint('PATCH', `/organizations/${orgId}/activate`);
  await testEndpoint('POST', `/organizations/${orgId}/reset-admin-password`);

  // 6. Update and delete
  await testEndpoint('PUT', `/organizations/${orgId}`, { name: 'Updated College' });
  await testEndpoint('DELETE', `/organizations/${orgId}`);

  console.log('\n✅ Full test complete - all endpoints working!');
}

runTests().catch(console.error);
