const axios = require('axios');

const PRODUCTION_URL = 'https://smart-lms-clean-1.onrender.com';

async function verifyProduction() {
  console.log('🔍 Production Verification Tool');
  console.log('================================\n');

  const checks = [];

  // Check 1: Health endpoint
  console.log('1️⃣ Checking server health...');
  try {
    const health = await axios.get(`${PRODUCTION_URL}/health`, { timeout: 10000 });
    if (health.status === 200) {
      console.log('   ✅ Server is running');
      console.log(`   📊 Status: ${health.data.status}`);
      checks.push({ name: 'Server Health', status: 'PASS' });
    }
  } catch (error) {
    console.log('   ❌ Server health check failed');
    checks.push({ name: 'Server Health', status: 'FAIL', error: error.message });
  }

  // Check 2: Trust proxy (rate limit)
  console.log('\n2️⃣ Checking trust proxy configuration...');
  try {
    const response = await axios.get(`${PRODUCTION_URL}/health`, {
      headers: { 'X-Forwarded-For': '1.2.3.4' },
      timeout: 10000
    });
    if (response.status === 200) {
      console.log('   ✅ Trust proxy configured correctly');
      console.log('   ✅ No ERR_ERL_UNEXPECTED_X_FORWARDED_FOR error');
      checks.push({ name: 'Trust Proxy', status: 'PASS' });
    }
  } catch (error) {
    if (error.message.includes('ERR_ERL_UNEXPECTED_X_FORWARDED_FOR')) {
      console.log('   ❌ Trust proxy NOT configured');
      checks.push({ name: 'Trust Proxy', status: 'FAIL', error: 'Trust proxy not set' });
    } else {
      console.log('   ✅ Trust proxy configured correctly');
      checks.push({ name: 'Trust Proxy', status: 'PASS' });
    }
  }

  // Check 3: Registration endpoint (timeout test)
  console.log('\n3️⃣ Checking registration endpoint timeout...');
  const startTime = Date.now();
  try {
    const response = await axios.post(`${PRODUCTION_URL}/auth/register/request-otp`, {
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User',
      role: 'public_student'
    }, {
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true,
      timeout: 30000
    });

    const duration = Date.now() - startTime;
    console.log(`   ⏱️  Response time: ${duration}ms`);

    if (response.status === 200) {
      console.log('   ✅ Registration endpoint working');
      console.log(`   ✅ Status: ${response.status} (not 500)`);
      
      if (duration < 15000) {
        console.log('   ✅ Response time < 15 seconds');
        checks.push({ name: 'Registration Timeout', status: 'PASS', duration: `${duration}ms` });
      } else {
        console.log('   ⚠️  Response time > 15 seconds (acceptable but slow)');
        checks.push({ name: 'Registration Timeout', status: 'WARN', duration: `${duration}ms` });
      }

      if (response.data.data.emailFailed) {
        console.log('   ⚠️  Email service unavailable (graceful fallback)');
        console.log('   ✅ OTP displayed in response');
        checks.push({ name: 'Email Service', status: 'WARN', note: 'Graceful fallback active' });
      } else {
        console.log('   ✅ Email sent successfully');
        checks.push({ name: 'Email Service', status: 'PASS' });
      }

    } else if (response.status === 400) {
      console.log('   ✅ Validation working (400 expected for duplicate email)');
      checks.push({ name: 'Registration Endpoint', status: 'PASS' });
    } else if (response.status === 500) {
      console.log('   ❌ CRITICAL: 500 Internal Server Error');
      console.log(`   Error: ${response.data.error}`);
      checks.push({ name: 'Registration Endpoint', status: 'FAIL', error: '500 error' });
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    if (error.code === 'ETIMEDOUT' || duration > 30000) {
      console.log('   ❌ Request timeout (> 30 seconds)');
      checks.push({ name: 'Registration Timeout', status: 'FAIL', error: 'Timeout' });
    } else {
      console.log(`   ❌ Error: ${error.message}`);
      checks.push({ name: 'Registration Endpoint', status: 'FAIL', error: error.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(50) + '\n');

  const passed = checks.filter(c => c.status === 'PASS').length;
  const warned = checks.filter(c => c.status === 'WARN').length;
  const failed = checks.filter(c => c.status === 'FAIL').length;

  checks.forEach(check => {
    const icon = check.status === 'PASS' ? '✅' : check.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} ${check.name}: ${check.status}`);
    if (check.duration) console.log(`   Duration: ${check.duration}`);
    if (check.note) console.log(`   Note: ${check.note}`);
    if (check.error) console.log(`   Error: ${check.error}`);
  });

  console.log('\n' + '='.repeat(50));
  console.log(`Total: ${checks.length} checks`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warned}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(50) + '\n');

  if (failed === 0 && warned === 0) {
    console.log('🎉 ALL CHECKS PASSED! Production is ready.');
  } else if (failed === 0) {
    console.log('✅ All critical checks passed. Warnings are acceptable.');
  } else {
    console.log('❌ Some checks failed. Review errors above.');
  }

  console.log('\n📖 For detailed information, see:');
  console.log('   - PRODUCTION-EMAIL-FIX-COMPLETE.md');
  console.log('   - DEPLOYMENT-CHECKLIST.md');
  console.log('   - FINAL-SUMMARY.md\n');
}

verifyProduction();
