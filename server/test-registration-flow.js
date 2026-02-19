/**
 * Test Complete Registration Flow
 * Tests: Request OTP → Verify OTP → Login
 */

const API_BASE = process.env.API_URL || 'https://smart-lms-clean-1.onrender.com';

async function testRegistrationFlow() {
  console.log('🧪 Testing Complete Registration Flow\n');
  console.log('API Base:', API_BASE);
  console.log('='.repeat(60));

  // Test data
  const testEmail = `test${Date.now()}@example.com`;
  const testData = {
    name: 'Test User',
    email: testEmail,
    password: 'TestPass123!',
    role: 'public_student'
  };

  try {
    // Step 1: Request OTP
    console.log('\n📝 Step 1: Request OTP for registration');
    console.log('POST /auth/register/request-otp');
    console.log('Data:', JSON.stringify(testData, null, 2));

    const registerResponse = await fetch(`${API_BASE}/auth/register/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const registerData = await registerResponse.json();
    console.log('Response Status:', registerResponse.status);
    console.log('Response:', JSON.stringify(registerData, null, 2));

    if (!registerData.success) {
      console.error('❌ Registration request failed:', registerData.message);
      return;
    }

    // Extract OTP from response
    const otp = registerData.data?.otp;
    if (!otp) {
      console.error('❌ No OTP in response!');
      console.log('Response data:', registerData.data);
      return;
    }

    console.log('✅ OTP received:', otp);
    if (registerData.data?.emailFailed) {
      console.log('⚠️ Email service failed - OTP displayed to user');
    }

    // Step 2: Verify OTP
    console.log('\n📝 Step 2: Verify OTP');
    console.log('POST /auth/register/verify-otp');
    console.log('Data:', JSON.stringify({ email: testEmail, otp }, null, 2));

    const verifyResponse = await fetch(`${API_BASE}/auth/register/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp })
    });

    const verifyData = await verifyResponse.json();
    console.log('Response Status:', verifyResponse.status);
    console.log('Response:', JSON.stringify(verifyData, null, 2));

    if (!verifyData.success) {
      console.error('❌ OTP verification failed:', verifyData.message);
      return;
    }

    const token = verifyData.data?.token;
    const user = verifyData.data?.user;

    if (!token || !user) {
      console.error('❌ No token or user in response!');
      return;
    }

    console.log('✅ User created:', user.email);
    console.log('✅ Token received:', token.substring(0, 20) + '...');

    // Step 3: Test Login
    console.log('\n📝 Step 3: Test Login');
    console.log('POST /auth/login');
    console.log('Data:', JSON.stringify({ email: testEmail, password: testData.password }, null, 2));

    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testData.password })
    });

    const loginData = await loginResponse.json();
    console.log('Response Status:', loginResponse.status);
    console.log('Response:', JSON.stringify(loginData, null, 2));

    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }

    console.log('✅ Login successful!');
    console.log('✅ Token received:', loginData.data?.token?.substring(0, 20) + '...');

    // Step 4: Test Protected Route
    console.log('\n📝 Step 4: Test Protected Route (/auth/me)');
    const meResponse = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${loginData.data.token}`,
        'Content-Type': 'application/json'
      }
    });

    const meData = await meResponse.json();
    console.log('Response Status:', meResponse.status);
    console.log('Response:', JSON.stringify(meData, null, 2));

    if (!meData.success) {
      console.error('❌ Protected route failed:', meData.message);
      return;
    }

    console.log('✅ Protected route working!');
    console.log('✅ User data retrieved:', meData.data?.email);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\nTest Summary:');
    console.log('✅ Registration OTP request - WORKING');
    console.log('✅ OTP verification - WORKING');
    console.log('✅ User creation - WORKING');
    console.log('✅ Login - WORKING');
    console.log('✅ Protected routes - WORKING');
    console.log('\nTest user created:');
    console.log('  Email:', testEmail);
    console.log('  Password:', testData.password);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testRegistrationFlow();
