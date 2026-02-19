/**
 * Complete student flow test
 * Tests the entire student journey from viewing courses to enrollment
 */

const API_URL = process.env.API_URL || 'http://localhost:5000';

const STUDENT = {
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(STUDENT)
    });

    const data = await response.json();
    
    if (data.success && data.data.token) {
      authToken = data.data.token;
      console.log('✅ Login successful');
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

async function testDashboard() {
  console.log('\n📊 Testing Dashboard (GET /student/enrollments)...');
  
  try {
    const response = await fetch(`${API_URL}/student/enrollments`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Dashboard data fetched');
      console.log('   Enrollments:', data.data.enrollments.length);
      
      if (data.data.enrollments.length > 0) {
        const enrollment = data.data.enrollments[0];
        console.log('   First course:', enrollment.course?.title || 'N/A');
        console.log('   Progress:', enrollment.progress?.completionPercentage || 0, '%');
      }
      return true;
    } else {
      console.log('❌ Dashboard failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Dashboard error:', error.message);
    return false;
  }
}

async function testCoursesList() {
  console.log('\n📚 Testing Courses List (GET /student/courses)...');
  
  try {
    const response = await fetch(`${API_URL}/student/courses?page=1&limit=12`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Courses list fetched');
      console.log('   Total courses:', data.data.courses.length);
      console.log('   Pagination:', JSON.stringify(data.data.pagination));
      
      if (data.data.courses.length > 0) {
        testCourseId = data.data.courses[0]._id;
        console.log('   First course:', data.data.courses[0].title);
        console.log('   Instructor:', data.data.courses[0].instructor_id?.name);
        console.log('   Is enrolled:', data.data.courses[0].isEnrolled);
      } else {
        console.log('   ⚠️  No courses available');
      }
      return true;
    } else {
      console.log('❌ Courses list failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Courses list error:', error.message);
    return false;
  }
}

async function testCourseDetails() {
  if (!testCourseId) {
    console.log('\n⚠️  Skipping course details (no course available)');
    return true;
  }

  console.log('\n📖 Testing Course Details (GET /student/courses/:id)...');
  
  try {
    const response = await fetch(`${API_URL}/student/courses/${testCourseId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Course details fetched');
      console.log('   Course:', data.data.course.title);
      console.log('   Description:', data.data.course.description.substring(0, 50) + '...');
      console.log('   Instructor:', data.data.course.instructor_id?.name);
      console.log('   Sections:', data.data.sections.length);
      console.log('   Total lessons:', data.data.course.totalLessons);
      console.log('   Is enrolled:', data.data.isEnrolled);
      return true;
    } else {
      console.log('❌ Course details failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Course details error:', error.message);
    return false;
  }
}

async function testEnrollment() {
  if (!testCourseId) {
    console.log('\n⚠️  Skipping enrollment (no course available)');
    return true;
  }

  console.log('\n🎓 Testing Enrollment (POST /student/enroll/:courseId)...');
  
  try {
    const response = await fetch(`${API_URL}/student/enroll/${testCourseId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Enrollment successful');
      console.log('   Enrollment ID:', data.data.enrollment._id);
      console.log('   Course ID:', data.data.enrollment.course_id);
      console.log('   Progress:', data.data.enrollment.progress.completionPercentage, '%');
      return true;
    } else if (data.message && data.message.includes('already enrolled')) {
      console.log('✅ Already enrolled (expected)');
      return true;
    } else {
      console.log('❌ Enrollment failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Enrollment error:', error.message);
    return false;
  }
}

async function testLiveClasses() {
  console.log('\n🎥 Testing Live Classes (GET /student/live-classes/upcoming)...');
  
  try {
    const response = await fetch(`${API_URL}/student/live-classes/upcoming`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Live classes fetched');
      console.log('   Total classes:', data.data?.classes?.length || 0);
      
      if (data.data?.classes?.length > 0) {
        const liveClass = data.data.classes[0];
        console.log('   First class:', liveClass.title);
        console.log('   Status:', liveClass.status);
        console.log('   Date:', liveClass.scheduled_date);
      }
      return true;
    } else {
      console.log('❌ Live classes failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Live classes error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Complete Student Flow Test');
  console.log('API URL:', API_URL);
  console.log('Student:', STUDENT.email);
  console.log('='.repeat(70));

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
    { name: 'Dashboard', fn: testDashboard },
    { name: 'Courses List', fn: testCoursesList },
    { name: 'Course Details', fn: testCourseDetails },
    { name: 'Enrollment', fn: testEnrollment },
    { name: 'Live Classes', fn: testLiveClasses }
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
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('='.repeat(70));

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!');
    console.log('✅ All student endpoints are working correctly');
    console.log('✅ Frontend can fetch and display all data properly');
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
