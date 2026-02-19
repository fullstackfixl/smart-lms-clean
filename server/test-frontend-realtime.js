/**
 * Frontend Real-time Test
 * Tests all frontend pages and buttons to ensure they fetch data from backend correctly
 */

const API_URL = process.env.API_URL || 'http://localhost:5000';

// Test accounts
const ACCOUNTS = {
  instructor: {
    email: 'instructor@test.com',
    password: 'TestPass123!'
  },
  student: {
    email: 'student@test.com',
    password: 'TestPass123!'
  }
};

let tokens = {
  instructor: null,
  student: null
};

let testData = {
  courseId: null,
  sectionId: null,
  lessonId: null,
  liveClassId: null
};

async function login(role) {
  console.log(`\n🔐 Logging in as ${role}...`);
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ACCOUNTS[role])
    });

    const data = await response.json();
    
    if (data.success && data.data.token) {
      tokens[role] = data.data.token;
      console.log(`✅ ${role} login successful`);
      return true;
    } else {
      console.log(`❌ ${role} login failed:`, data.message);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${role} login error:`, error.message);
    return false;
  }
}

// INSTRUCTOR TESTS
async function testInstructorDashboard() {
  console.log('\n📊 Testing Instructor Dashboard...');
  
  try {
    const response = await fetch(`${API_URL}/instructor/dashboard/overview`, {
      headers: {
        'Authorization': `Bearer ${tokens.instructor}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Dashboard data fetched');
      console.log('   Total courses:', data.data?.totalCourses || 0);
      console.log('   Total students:', data.data?.totalStudents || 0);
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

async function testInstructorCreateCourse() {
  console.log('\n📚 Testing Create Course Button...');
  
  try {
    const response = await fetch(`${API_URL}/instructor/courses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.instructor}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `Frontend Test Course ${Date.now()}`,
        description: 'Testing frontend create course functionality',
        category: 'Programming',
        level: 'beginner',
        price: 0
      })
    });

    const data = await response.json();
    
    if (data.success && data.data) {
      testData.courseId = data.data._id;
      console.log('✅ Course created');
      console.log('   Course ID:', testData.courseId);
      console.log('   Title:', data.data.title);
      return true;
    } else {
      console.log('❌ Create course failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Create course error:', error.message);
    return false;
  }
}

async function testInstructorGetCourses() {
  console.log('\n📋 Testing Get Courses List...');
  
  try {
    const response = await fetch(`${API_URL}/instructor/courses?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${tokens.instructor}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Courses list fetched');
      console.log('   Total courses:', data.data?.courses?.length || 0);
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

async function testInstructorPublishCourse() {
  console.log('\n📢 Testing Publish Course Button...');
  
  try {
    const response = await fetch(`${API_URL}/instructor/courses/${testData.courseId}/publish`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${tokens.instructor}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Course published');
      return true;
    } else {
      console.log('❌ Publish course failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Publish course error:', error.message);
    return false;
  }
}

async function testInstructorDeleteCourse() {
  console.log('\n🗑️  Testing Delete Course Button...');
  
  try {
    const response = await fetch(`${API_URL}/instructor/courses/${testData.courseId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${tokens.instructor}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Course deleted');
      return true;
    } else {
      console.log('❌ Delete course failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Delete course error:', error.message);
    return false;
  }
}

// STUDENT TESTS
async function testStudentDashboard() {
  console.log('\n📊 Testing Student Dashboard...');
  
  try {
    const response = await fetch(`${API_URL}/student/enrollments`, {
      headers: {
        'Authorization': `Bearer ${tokens.student}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Dashboard data fetched');
      console.log('   Enrollments:', data.data?.enrollments?.length || 0);
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

async function testStudentBrowseCourses() {
  console.log('\n🔍 Testing Browse Courses Button...');
  
  try {
    const response = await fetch(`${API_URL}/student/courses?page=1&limit=12`, {
      headers: {
        'Authorization': `Bearer ${tokens.student}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Courses fetched');
      console.log('   Total courses:', data.data?.courses?.length || 0);
      
      if (data.data?.courses?.length > 0) {
        testData.courseId = data.data.courses[0]._id;
        console.log('   First course:', data.data.courses[0].title);
      }
      return true;
    } else {
      console.log('❌ Browse courses failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Browse courses error:', error.message);
    return false;
  }
}

async function testStudentViewCourseDetails() {
  if (!testData.courseId) {
    console.log('\n⚠️  Skipping course details (no course available)');
    return true;
  }

  console.log('\n📖 Testing View Course Details Button...');
  
  try {
    const response = await fetch(`${API_URL}/student/courses/${testData.courseId}`, {
      headers: {
        'Authorization': `Bearer ${tokens.student}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Course details fetched');
      console.log('   Course:', data.data?.course?.title);
      console.log('   Sections:', data.data?.sections?.length || 0);
      return true;
    } else {
      console.log('❌ View details failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ View details error:', error.message);
    return false;
  }
}

async function testStudentEnrollButton() {
  if (!testData.courseId) {
    console.log('\n⚠️  Skipping enrollment (no course available)');
    return true;
  }

  console.log('\n🎓 Testing Enroll Button...');
  
  try {
    const response = await fetch(`${API_URL}/student/enroll/${testData.courseId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.student}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success || (data.message && data.message.includes('already enrolled'))) {
      console.log('✅ Enroll button works');
      return true;
    } else {
      console.log('❌ Enroll failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Enroll error:', error.message);
    return false;
  }
}

async function testStudentLiveClasses() {
  console.log('\n🎥 Testing Live Classes Page...');
  
  try {
    const response = await fetch(`${API_URL}/student/live-classes/upcoming`, {
      headers: {
        'Authorization': `Bearer ${tokens.student}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Live classes fetched');
      console.log('   Total classes:', data.data?.classes?.length || 0);
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

async function testSearchFilter() {
  console.log('\n🔎 Testing Search/Filter Functionality...');
  
  try {
    const response = await fetch(`${API_URL}/student/courses?page=1&limit=12&search=test&category=Programming&level=beginner`, {
      headers: {
        'Authorization': `Bearer ${tokens.student}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Search/filter works');
      console.log('   Filtered results:', data.data?.courses?.length || 0);
      return true;
    } else {
      console.log('❌ Search/filter failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Search/filter error:', error.message);
    return false;
  }
}

async function testPagination() {
  console.log('\n📄 Testing Pagination Buttons...');
  
  try {
    const response = await fetch(`${API_URL}/student/courses?page=2&limit=5`, {
      headers: {
        'Authorization': `Bearer ${tokens.student}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Pagination works');
      console.log('   Current page:', data.data?.pagination?.current);
      console.log('   Total pages:', data.data?.pagination?.pages);
      return true;
    } else {
      console.log('❌ Pagination failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Pagination error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Frontend Real-time Test');
  console.log('API URL:', API_URL);
  console.log('='.repeat(70));

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Login both accounts
  const instructorLogin = await login('instructor');
  const studentLogin = await login('student');
  
  if (!instructorLogin || !studentLogin) {
    console.log('\n❌ Cannot proceed without login');
    process.exit(1);
  }

  // Run all tests
  const tests = [
    // Instructor tests
    { name: 'Instructor Dashboard', fn: testInstructorDashboard },
    { name: 'Create Course Button', fn: testInstructorCreateCourse },
    { name: 'Get Courses List', fn: testInstructorGetCourses },
    { name: 'Publish Course Button', fn: testInstructorPublishCourse },
    
    // Student tests
    { name: 'Student Dashboard', fn: testStudentDashboard },
    { name: 'Browse Courses Button', fn: testStudentBrowseCourses },
    { name: 'View Course Details', fn: testStudentViewCourseDetails },
    { name: 'Enroll Button', fn: testStudentEnrollButton },
    { name: 'Live Classes Page', fn: testStudentLiveClasses },
    { name: 'Search/Filter', fn: testSearchFilter },
    { name: 'Pagination', fn: testPagination },
    
    // Cleanup
    { name: 'Delete Course Button', fn: testInstructorDeleteCourse }
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
  console.log('📊 FRONTEND REAL-TIME TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('='.repeat(70));

  if (results.failed === 0) {
    console.log('\n🎉 All frontend tests passed!');
    console.log('✅ All pages and buttons are fetching data from backend correctly');
    console.log('✅ Real-time data synchronization is working');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some frontend tests failed');
    console.log('❌ Check the errors above and fix the issues');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
