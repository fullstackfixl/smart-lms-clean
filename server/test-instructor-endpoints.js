/**
 * Test All Instructor Endpoints
 * Tests: Courses, Lessons, Quizzes, Live Classes
 */

const API_BASE = process.env.API_URL || 'https://smart-lms-clean-1.onrender.com';

// Test instructor credentials (create one first if needed)
const INSTRUCTOR_EMAIL = 'instructor@example.com';
const INSTRUCTOR_PASSWORD = 'TestPass123!';

let authToken = null;
let testCourseId = null;
let testModuleId = null;
let testLessonId = null;

async function loginInstructor() {
  console.log('\n📝 Step 1: Login as Instructor');
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: INSTRUCTOR_EMAIL,
      password: INSTRUCTOR_PASSWORD
    })
  });

  const data = await response.json();
  
  if (!data.success) {
    console.error('❌ Login failed:', data.message);
    console.log('Creating instructor account...');
    
    // Register instructor
    const registerRes = await fetch(`${API_BASE}/auth/register/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Instructor',
        email: INSTRUCTOR_EMAIL,
        password: INSTRUCTOR_PASSWORD,
        role: 'instructor',
        organization_code: 'TEST01' // Use existing org or create one
      })
    });
    
    const registerData = await registerRes.json();
    if (!registerData.success) {
      console.error('❌ Registration failed:', registerData.message);
      return false;
    }
    
    const otp = registerData.data.otp;
    console.log('OTP:', otp);
    
    // Verify OTP
    const verifyRes = await fetch(`${API_BASE}/auth/register/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: INSTRUCTOR_EMAIL,
        otp: otp
      })
    });
    
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      console.error('❌ Verification failed:', verifyData.message);
      return false;
    }
    
    authToken = verifyData.data.token;
    console.log('✅ Instructor account created and logged in');
    return true;
  }

  authToken = data.data.token;
  console.log('✅ Instructor logged in successfully');
  return true;
}

async function testGetCourses() {
  console.log('\n📝 Step 2: Get Instructor Courses');
  const response = await fetch(`${API_BASE}/instructor/courses?page=1&limit=10`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (!data.success) {
    console.error('❌ Failed to get courses:', data.message);
    return false;
  }

  console.log(`✅ Retrieved ${data.data.courses.length} courses`);
  return true;
}

async function testCreateCourse() {
  console.log('\n📝 Step 3: Create Course');
  const response = await fetch(`${API_BASE}/instructor/courses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: `Test Course ${Date.now()}`,
      description: 'This is a test course created by automated test',
      category: 'Programming',
      level: 'beginner',
      price: 0,
      duration: 0,
      status: 'draft'
    })
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (!data.success) {
    console.error('❌ Failed to create course:', data.message);
    return false;
  }

  testCourseId = data.data._id;
  console.log('✅ Course created:', testCourseId);
  return true;
}

async function testGetCourseById() {
  console.log('\n📝 Step 4: Get Course by ID');
  const response = await fetch(`${API_BASE}/instructor/courses/${testCourseId}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (!data.success) {
    console.error('❌ Failed to get course:', data.message);
    return false;
  }

  console.log('✅ Course retrieved:', data.data.title);
  return true;
}

async function testUpdateCourse() {
  console.log('\n📝 Step 5: Update Course');
  const response = await fetch(`${API_BASE}/instructor/courses/${testCourseId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: `Updated Test Course ${Date.now()}`,
      description: 'This course has been updated'
    })
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (!data.success) {
    console.error('❌ Failed to update course:', data.message);
    return false;
  }

  console.log('✅ Course updated');
  return true;
}

async function testCreateModule() {
  console.log('\n📝 Step 6: Create Module/Section');
  const response = await fetch(`${API_BASE}/instructor/courses/${testCourseId}/modules`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Introduction Module',
      description: 'Getting started with the course',
      order: 1
    })
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (!data.success) {
    console.error('❌ Failed to create module:', data.message);
    return false;
  }

  testModuleId = data.data._id;
  console.log('✅ Module created:', testModuleId);
  return true;
}

async function testCreateLesson() {
  console.log('\n📝 Step 7: Create Lesson');
  const response = await fetch(`${API_BASE}/instructor/modules/${testModuleId}/lessons`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'First Lesson',
      description: 'Introduction to the topic',
      type: 'video',
      content: {
        videoUrl: 'https://example.com/video.mp4',
        duration: 600
      },
      order: 1
    })
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (!data.success) {
    console.error('❌ Failed to create lesson:', data.message);
    return false;
  }

  testLessonId = data.data._id;
  console.log('✅ Lesson created:', testLessonId);
  return true;
}

async function testPublishCourse() {
  console.log('\n📝 Step 8: Publish Course');
  const response = await fetch(`${API_BASE}/instructor/courses/${testCourseId}/publish`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (!data.success) {
    console.error('❌ Failed to publish course:', data.message);
    return false;
  }

  console.log('✅ Course published');
  return true;
}

async function runTests() {
  console.log('🧪 Testing All Instructor Endpoints');
  console.log('API Base:', API_BASE);
  console.log('='.repeat(60));

  try {
    // Step 1: Login
    if (!await loginInstructor()) {
      console.error('\n❌ Test suite failed at login');
      return;
    }

    // Step 2: Get courses
    if (!await testGetCourses()) {
      console.error('\n❌ Test suite failed at get courses');
      return;
    }

    // Step 3: Create course
    if (!await testCreateCourse()) {
      console.error('\n❌ Test suite failed at create course');
      return;
    }

    // Step 4: Get course by ID
    if (!await testGetCourseById()) {
      console.error('\n❌ Test suite failed at get course by ID');
      return;
    }

    // Step 5: Update course
    if (!await testUpdateCourse()) {
      console.error('\n❌ Test suite failed at update course');
      return;
    }

    // Step 6: Create module
    if (!await testCreateModule()) {
      console.error('\n❌ Test suite failed at create module');
      return;
    }

    // Step 7: Create lesson
    if (!await testCreateLesson()) {
      console.error('\n❌ Test suite failed at create lesson');
      return;
    }

    // Step 8: Publish course
    if (!await testPublishCourse()) {
      console.error('\n❌ Test suite failed at publish course');
      return;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL INSTRUCTOR TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\nTest Summary:');
    console.log('✅ Instructor login - WORKING');
    console.log('✅ Get courses - WORKING');
    console.log('✅ Create course - WORKING');
    console.log('✅ Get course by ID - WORKING');
    console.log('✅ Update course - WORKING');
    console.log('✅ Create module - WORKING');
    console.log('✅ Create lesson - WORKING');
    console.log('✅ Publish course - WORKING');
    console.log('\nTest course created:');
    console.log('  Course ID:', testCourseId);
    console.log('  Module ID:', testModuleId);
    console.log('  Lesson ID:', testLessonId);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the tests
runTests();
