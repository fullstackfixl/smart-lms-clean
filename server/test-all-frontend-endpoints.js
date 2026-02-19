/**
 * Comprehensive Frontend Real-Time Test
 * Tests all critical frontend pages and their backend endpoints
 */

const API_URL = process.env.API_URL || 'https://smart-lms-clean-1.onrender.com';

// Test credentials
const INSTRUCTOR_EMAIL = 'instructor@test.com';
const INSTRUCTOR_PASSWORD = 'TestPass123!';
const STUDENT_EMAIL = 'student@test.com';
const STUDENT_PASSWORD = 'TestPass123!';

let instructorToken = null;
let studentToken = null;
let testCourseId = null;

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

// Test functions
async function testInstructorLogin() {
  console.log('\n🔐 Testing Instructor Login...');
  const { status, data } = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: INSTRUCTOR_EMAIL,
      password: INSTRUCTOR_PASSWORD,
    }),
  });
  
  if (status === 200 && data.success && data.data.token) {
    instructorToken = data.data.token;
    console.log('✅ Instructor login successful');
    return true;
  } else {
    console.log('❌ Instructor login failed:', data.message);
    return false;
  }
}

async function testStudentLogin() {
  console.log('\n🔐 Testing Student Login...');
  const { status, data } = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: STUDENT_EMAIL,
      password: STUDENT_PASSWORD,
    }),
  });
  
  if (status === 200 && data.success && data.data.token) {
    studentToken = data.data.token;
    console.log('✅ Student login successful');
    return true;
  } else {
    console.log('❌ Student login failed:', data.message);
    return false;
  }
}

async function testInstructorDashboard() {
  console.log('\n📊 Testing Instructor Dashboard...');
  const { status, data } = await apiCall('/instructor/dashboard/overview', {
    headers: { Authorization: `Bearer ${instructorToken}` },
  });
  
  if (status === 200 && data.success) {
    console.log('✅ Instructor dashboard loaded');
    console.log(`   - Total Courses: ${data.data.totalCourses}`);
    console.log(`   - Total Students: ${data.data.totalStudents}`);
    console.log(`   - Total Lectures: ${data.data.totalLectures}`);
    console.log(`   - Completion Rate: ${Math.round(data.data.completionRate)}%`);
    return true;
  } else {
    console.log('❌ Instructor dashboard failed:', data.message);
    return false;
  }
}

async function testInstructorCourses() {
  console.log('\n📚 Testing Instructor Courses List...');
  const { status, data } = await apiCall('/instructor/courses?page=1&limit=12', {
    headers: { Authorization: `Bearer ${instructorToken}` },
  });
  
  if (status === 200 && data.success) {
    const courses = data.data.courses || data.data || [];
    console.log(`✅ Instructor courses loaded: ${courses.length} courses`);
    
    if (courses.length > 0) {
      testCourseId = courses[0]._id;
      console.log(`   - First course: "${courses[0].title}"`);
      console.log(`   - Status: ${courses[0].status}`);
      console.log(`   - Enrollments: ${courses[0].enrollmentCount || 0}`);
    }
    return true;
  } else {
    console.log('❌ Instructor courses failed:', data.message);
    return false;
  }
}

async function testStudentDashboard() {
  console.log('\n📊 Testing Student Dashboard...');
  const { status, data } = await apiCall('/student/enrollments', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  
  if (status === 200 && data.success) {
    const enrollments = data.data.enrollments || [];
    console.log(`✅ Student dashboard loaded: ${enrollments.length} enrollments`);
    
    if (enrollments.length > 0) {
      const enrollment = enrollments[0];
      console.log(`   - Course: "${enrollment.course.title}"`);
      console.log(`   - Progress: ${enrollment.progress?.completionPercentage || 0}%`);
      console.log(`   - Status: ${enrollment.status}`);
    }
    return true;
  } else {
    console.log('❌ Student dashboard failed:', data.message);
    return false;
  }
}

async function testStudentCoursesList() {
  console.log('\n📚 Testing Student Courses List...');
  const { status, data } = await apiCall('/student/courses?page=1&limit=12', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  
  if (status === 200 && data.success) {
    const courses = data.data.courses || [];
    console.log(`✅ Student courses list loaded: ${courses.length} courses`);
    
    if (courses.length > 0) {
      console.log(`   - First course: "${courses[0].title}"`);
      console.log(`   - Instructor: ${courses[0].instructor_id?.name || 'Unknown'}`);
      console.log(`   - Enrolled: ${courses[0].isEnrolled ? 'Yes' : 'No'}`);
    }
    return true;
  } else {
    console.log('❌ Student courses list failed:', data.message);
    return false;
  }
}

async function testCourseDetails() {
  if (!testCourseId) {
    console.log('\n⚠️  Skipping course details test (no course ID)');
    return true;
  }
  
  console.log('\n📖 Testing Course Details Page...');
  const { status, data } = await apiCall(`/student/courses/${testCourseId}`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  
  if (status === 200 && data.success) {
    console.log('✅ Course details loaded');
    console.log(`   - Title: "${data.data.course.title}"`);
    console.log(`   - Sections: ${data.data.sections?.length || 0}`);
    console.log(`   - Enrolled: ${data.data.isEnrolled ? 'Yes' : 'No'}`);
    return true;
  } else {
    console.log('❌ Course details failed:', data.message);
    return false;
  }
}

async function testSearchAndFilter() {
  console.log('\n🔍 Testing Search and Filter...');
  
  // Test search
  const { status: searchStatus, data: searchData } = await apiCall(
    '/student/courses?page=1&limit=12&search=test',
    { headers: { Authorization: `Bearer ${studentToken}` } }
  );
  
  if (searchStatus === 200 && searchData.success) {
    console.log('✅ Search working');
  } else {
    console.log('❌ Search failed');
    return false;
  }
  
  // Test category filter
  const { status: filterStatus, data: filterData } = await apiCall(
    '/student/courses?page=1&limit=12&category=programming',
    { headers: { Authorization: `Bearer ${studentToken}` } }
  );
  
  if (filterStatus === 200 && filterData.success) {
    console.log('✅ Category filter working');
  } else {
    console.log('❌ Category filter failed');
    return false;
  }
  
  // Test level filter
  const { status: levelStatus, data: levelData } = await apiCall(
    '/student/courses?page=1&limit=12&level=beginner',
    { headers: { Authorization: `Bearer ${studentToken}` } }
  );
  
  if (levelStatus === 200 && levelData.success) {
    console.log('✅ Level filter working');
  } else {
    console.log('❌ Level filter failed');
    return false;
  }
  
  return true;
}

async function testPagination() {
  console.log('\n📄 Testing Pagination...');
  
  const { status, data } = await apiCall('/student/courses?page=1&limit=5', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  
  if (status === 200 && data.success && data.data.pagination) {
    console.log('✅ Pagination working');
    console.log(`   - Current page: ${data.data.pagination.page}`);
    console.log(`   - Total pages: ${data.data.pagination.pages}`);
    console.log(`   - Total items: ${data.data.pagination.total}`);
    return true;
  } else {
    console.log('❌ Pagination failed');
    return false;
  }
}

async function testInstructorLiveClasses() {
  console.log('\n🎥 Testing Instructor Live Classes...');
  const { status, data } = await apiCall('/instructor/live-classes', {
    headers: { Authorization: `Bearer ${instructorToken}` },
  });
  
  if (status === 200 && data.success) {
    const classes = data.data.liveClasses || data.data || [];
    console.log(`✅ Live classes loaded: ${classes.length} classes`);
    return true;
  } else {
    console.log('❌ Live classes failed:', data.message);
    return false;
  }
}

async function testInstructorNotifications() {
  console.log('\n🔔 Testing Instructor Notifications...');
  const { status, data } = await apiCall('/instructor/notifications', {
    headers: { Authorization: `Bearer ${instructorToken}` },
  });
  
  if (status === 200 && data.success) {
    const notifications = data.data.notifications || data.data || [];
    console.log(`✅ Notifications loaded: ${notifications.length} notifications`);
    return true;
  } else {
    console.log('❌ Notifications failed:', data.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🚀 COMPREHENSIVE FRONTEND REAL-TIME TEST');
  console.log('='.repeat(60));
  console.log(`Testing API: ${API_URL}`);
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };
  
  const tests = [
    { name: 'Instructor Login', fn: testInstructorLogin },
    { name: 'Student Login', fn: testStudentLogin },
    { name: 'Instructor Dashboard', fn: testInstructorDashboard },
    { name: 'Instructor Courses', fn: testInstructorCourses },
    { name: 'Student Dashboard', fn: testStudentDashboard },
    { name: 'Student Courses List', fn: testStudentCoursesList },
    { name: 'Course Details', fn: testCourseDetails },
    { name: 'Search and Filter', fn: testSearchAndFilter },
    { name: 'Pagination', fn: testPagination },
    { name: 'Instructor Live Classes', fn: testInstructorLiveClasses },
    { name: 'Instructor Notifications', fn: testInstructorNotifications },
  ];
  
  for (const test of tests) {
    results.total++;
    try {
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} threw error:`, error.message);
      results.failed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}/${results.total}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  console.log('='.repeat(60));
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Frontend is working perfectly with backend!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run tests
runAllTests().catch(console.error);
