/**
 * Test script for student endpoints
 * Tests all student API endpoints to ensure they work properly
 */

const API_URL = process.env.API_URL || 'http://localhost:5000';

// Test user credentials (use existing student account)
const TEST_STUDENT = {
  email: 'student@test.com',
  password: 'TestPass123!'
};

let authToken = null;
let testCourseId = null;

async function login() {
  console.log('\n🔐 Logging in as student...');
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_STUDENT)
    });

    const data = await response.json();
    
    if (data.success && data.data.token) {
      authToken = data.data.token;
      console.log('✅ Login successful');
      console.log('   Token:', authToken.substring(0, 20) + '...');
      return true;
    } else {
      console.log('❌ Login failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return false;
  }
}

async function testGetCourses() {
  console.log('\n📚 Testing GET /student/courses...');
  
  try {
    const response = await fetch(`${API_URL}/student/courses?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Get courses successful');
      console.log('   Total courses:', data.data.courses.length);
      console.log('   Pagination:', data.data.pagination);
      
      if (data.data.courses.length > 0) {
        testCourseId = data.data.courses[0]._id;
        console.log('   First course:', data.data.courses[0].title);
        console.log('   Course ID:', testCourseId);
      }
      return true;
    } else {
      console.log('❌ Get courses failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Get courses error:', error.message);
    return false;
  }
}

async function testGetCourseDetails() {
  if (!testCourseId) {
    console.log('\n⚠️  Skipping course details test (no course ID)');
    return true;
  }

  console.log('\n📖 Testing GET /student/courses/:id...');
  
  try {
    const response = await fetch(`${API_URL}/student/courses/${testCourseId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Get course details successful');
      console.log('   Course:', data.data.course.title);
      console.log('   Sections:', data.data.sections.length);
      console.log('   Is enrolled:', data.data.isEnrolled);
      console.log('   Total lessons:', data.data.course.totalLessons);
      return true;
    } else {
      console.log('❌ Get course details failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Get course details error:', error.message);
    return false;
  }
}

async function testGetEnrollments() {
  console.log('\n🎓 Testing GET /student/enrollments...');
  
  try {
    const response = await fetch(`${API_URL}/student/enrollments`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Get enrollments successful');
      console.log('   Total enrollments:', data.data.enrollments.length);
      
      if (data.data.enrollments.length > 0) {
        const enrollment = data.data.enrollments[0];
        console.log('   First enrollment:', enrollment.course?.title || 'Unknown');
        console.log('   Progress:', enrollment.progress?.completionPercentage || 0, '%');
      } else {
        console.log('   No enrollments found');
      }
      return true;
    } else {
      console.log('❌ Get enrollments failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Get enrollments error:', error.message);
    return false;
  }
}

async function testGetLiveClasses() {
  console.log('\n🎥 Testing GET /student/live-classes/upcoming...');
  
  try {
    const response = await fetch(`${API_URL}/student/live-classes/upcoming`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Get live classes successful');
      console.log('   Total classes:', data.data?.classes?.length || 0);
      
      if (data.data?.classes?.length > 0) {
        const liveClass = data.data.classes[0];
        console.log('   First class:', liveClass.title);
        console.log('   Status:', liveClass.status);
      } else {
        console.log('   No upcoming live classes');
      }
      return true;
    } else {
      console.log('❌ Get live classes failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Get live classes error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Student Endpoints Test');
  console.log('API URL:', API_URL);
  console.log('Test Student:', TEST_STUDENT.email);
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without login');
    process.exit(1);
  }

  // Run all tests
  const tests = [
    { name: 'Get Courses', fn: testGetCourses },
    { name: 'Get Course Details', fn: testGetCourseDetails },
    { name: 'Get Enrollments', fn: testGetEnrollments },
    { name: 'Get Live Classes', fn: testGetLiveClasses }
  ];

  for (const test of tests) {
    results.total++;
    const success = await test.fn();
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('='.repeat(50));

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
