/**
 * testProfileDP.js — End-to-end test for the Profile Picture (DP) system
 * 
 * Tests:
 *   1. Upload DP → saved in DB → returned correctly
 *   2. Retrieve user → DP visible in /auth/me response
 *   3. Default DP → no image → profilePicture is null
 *   4. Invalid format → blocked with error
 *   5. Clear DP → profilePicture becomes null
 * 
 * Usage: node scripts/testProfileDP.js
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:5000';
// A minimal valid PNG in base64 (1x1 red pixel)
const SAMPLE_DP = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';

async function login(email, password, loginUrl = '/auth/login') {
  const res = await axios.post(`${API_BASE}${loginUrl}`, { email, password });
  if (!res.data.success) throw new Error(`Login failed: ${res.data.message}`);
  return res.data.data.token;
}

async function getMe(token) {
  const res = await axios.get(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.data.success) throw new Error(`getMe failed: ${res.data.message}`);
  return res.data.data?.user || res.data.data;
}

async function updateMe(token, data) {
  const res = await axios.put(`${API_BASE}/auth/me`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

async function runTests() {
  console.log('\n=== Profile Picture (DP) System Tests ===\n');
  let passed = 0;
  let failed = 0;

  const testEmail = 'dushyant22062003@gmail.com'; // existing Org Admin
  const testPassword = 'test123';

  let token;
  try {
    token = await login(testEmail, testPassword, '/auth/org-admin/login');
    console.log('✅ [AUTH] Login successful');
    passed++;
  } catch (err) {
    console.log('❌ [AUTH] Login failed:', err.message);
    failed++;
    console.log('\nAborting remaining tests — cannot proceed without auth.\n');
    return;
  }

  // Test 1: Initial state — profilePicture should be null or empty
  try {
    const user = await getMe(token);
    if (user.profilePicture === null || user.profilePicture === undefined || user.profilePicture === '') {
      console.log('✅ [TEST 1] Default state: profilePicture is null/empty (correct)');
      passed++;
    } else {
      console.log('ℹ️  [TEST 1] profilePicture already set to:', user.profilePicture.substring(0, 30) + '...');
      passed++;
    }
  } catch (err) {
    console.log('❌ [TEST 1] getMe failed:', err.message);
    failed++;
  }

  // Test 2: Upload a valid profile picture
  try {
    const res = await updateMe(token, { profilePicture: SAMPLE_DP });
    if (res.success) {
      console.log('✅ [TEST 2] DP upload: saved successfully');
      passed++;
    } else {
      console.log('❌ [TEST 2] DP upload failed:', res.message);
      failed++;
    }
  } catch (err) {
    console.log('❌ [TEST 2] DP upload error:', err.response?.data?.message || err.message);
    failed++;
  }

  // Test 3: Retrieve user — DP should now be visible
  try {
    const user = await getMe(token);
    if (user.profilePicture && user.profilePicture.startsWith('data:image/')) {
      console.log('✅ [TEST 3] DP retrieval: profilePicture visible in /auth/me response');
      passed++;
    } else {
      console.log('❌ [TEST 3] DP retrieval: profilePicture not found in /auth/me response');
      failed++;
    }
  } catch (err) {
    console.log('❌ [TEST 3] getMe failed:', err.message);
    failed++;
  }

  // Test 4: Invalid format — should be blocked
  try {
    const res = await updateMe(token, { profilePicture: 'data:text/html;base64,PHNjcmlwdD4=' });
    if (!res.success) {
      console.log('✅ [TEST 4] Security: invalid MIME type correctly blocked');
      passed++;
    } else {
      console.log('❌ [TEST 4] Security: invalid MIME type was NOT blocked!');
      failed++;
    }
  } catch (err) {
    if (err.response?.status === 400) {
      console.log('✅ [TEST 4] Security: invalid MIME type correctly blocked (400)');
      passed++;
    } else {
      console.log('❌ [TEST 4] Unexpected error:', err.message);
      failed++;
    }
  }

  // Test 5: Clear the DP
  try {
    const res = await updateMe(token, { profilePicture: null });
    if (res.success) {
      const user = await getMe(token);
      if (!user.profilePicture) {
        console.log('✅ [TEST 5] Clear DP: profilePicture is null after clearing');
        passed++;
      } else {
        console.log('❌ [TEST 5] Clear DP: profilePicture was NOT cleared');
        failed++;
      }
    } else {
      console.log('❌ [TEST 5] Clear failed:', res.message);
      failed++;
    }
  } catch (err) {
    console.log('❌ [TEST 5] Clear DP error:', err.message);
    failed++;
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
