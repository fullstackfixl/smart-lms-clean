/**
 * Test organization isolation
 * Verify that courses created by instructors are visible to students in the same organization
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Course = require('./src/models/Course');
const bcrypt = require('bcryptjs');

const API_URL = process.env.API_URL || 'http://localhost:5000';

let instructorToken = null;
let studentToken = null;
let testCourseId = null;
let organizationId = null;

// Test accounts
const INSTRUCTOR = {
  name: 'Test Instructor',
  email: 'instructor@test.com',
  password: 'TestPass123!',
  role: 'instructor'
};

const STUDENT = {
  name: 'Test Student',
  email: 'student@test.com',
  password: 'TestPass123!',
  role: 'student'
};

async function setupTestAccounts() {
  console.log('\n🔧 Setting up test accounts...');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find or create organization
    const existingUser = await User.findOne({ role: { $in: ['instructor', 'org_admin'] } });
    if (!existingUser || !existingUser.organization_id) {
      console.log('❌ No organization found');
      return false;
    }

    organizationId = existingUser.organization_id;
    console.log('📍 Using organization:', organizationId);

    // Create or verify instructor
    let instructor = await User.findOne({ email: INSTRUCTOR.email });
    if (!instructor) {
      const hashedPassword = await bcrypt.hash(INSTRUCTOR.password, 10);
      instructor = new User({
        name: INSTRUCTOR.name,
        email: INSTRUCTOR.email,
        password_hash: hashedPassword,
        role: INSTRUCTOR.role,
        organization_id: organizationId,
        email_verified: true,
        isActive: true
      });
      await instructor.save();
      console.log('✅ Created instructor account');
    } else {
      console.log('✅ Instructor account exists');
    }

    // Create or verify student
    let student = await User.findOne({ email: STUDENT.email });
    if (!student) {
      const hashedPassword = await bcrypt.hash(STUDENT.password, 10);
      student = new User({
        name: STUDENT.name,
        email: STUDENT.email,
        password_hash: hashedPassword,
        role: STUDENT.role,
        organization_id: organizationId,
        email_verified: true,
        isActive: true
      });
      await student.save();
      console.log('✅ Created student account');
    } else {
      // Ensure student is verified
      await User.updateOne(
        { email: STUDENT.email },
        { email_verified: true, isActive: true }
      );
      console.log('✅ Student account exists and verified');
    }

    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.error('❌ Setup error:', error.message);
    return false;
  }
}

async function loginInstructor() {
  console.log('\n🔐 Logging in as instructor...');
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: INSTRUCTOR.email,
        password: INSTRUCTOR.password
      })
    });

    const data = await response.json();
    
    if (data.success && data.data.token) {
      instructorToken = data.data.token;
      console.log('✅ Instructor login successful');
      return true;
    } else {
      console.log('❌ Instructor login failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Instructor login error:', error.message);
    return false;
  }
}

async function loginStudent() {
  console.log('\n🔐 Logging in as student...');
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: STUDENT.email,
        password: STUDENT.password
      })
    });

    const data = await response.json();
    
    if (data.success && data.data.token) {
      studentToken = data.data.token;
      console.log('✅ Student login successful');
      return true;
    } else {
      console.log('❌ Student login failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Student login error:', error.message);
    return false;
  }
}

async function createTestCourse() {
  console.log('\n📚 Creating test course as instructor...');
  
  try {
    const response = await fetch(`${API_URL}/instructor/courses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${instructorToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `Test Course ${Date.now()}`,
        description: 'This course should be visible to all students in the same organization',
        category: 'Programming',
        level: 'beginner',
        price: 0
      })
    });

    const data = await response.json();
    
    if (data.success && data.data) {
      testCourseId = data.data._id;
      console.log('✅ Course created successfully');
      console.log('   Course ID:', testCourseId);
      console.log('   Title:', data.data.title);
      console.log('   Status:', data.data.status);
      return true;
    } else {
      console.log('❌ Course creation failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Course creation error:', error.message);
    return false;
  }
}

async function publishCourse() {
  console.log('\n📢 Publishing course...');
  
  try {
    const response = await fetch(`${API_URL}/instructor/courses/${testCourseId}/publish`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${instructorToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Course published successfully');
      return true;
    } else {
      console.log('❌ Course publish failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Course publish error:', error.message);
    return false;
  }
}

async function studentViewCourses() {
  console.log('\n👀 Student viewing courses...');
  
  try {
    const response = await fetch(`${API_URL}/student/courses?page=1&limit=20`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Student can view courses');
      console.log('   Total courses:', data.data.courses.length);
      
      // Check if our test course is visible
      const testCourse = data.data.courses.find(c => c._id === testCourseId);
      if (testCourse) {
        console.log('✅ TEST COURSE IS VISIBLE TO STUDENT!');
        console.log('   Course:', testCourse.title);
        console.log('   Instructor:', testCourse.instructor_id?.name);
        console.log('   Is Enrolled:', testCourse.isEnrolled);
        return true;
      } else {
        console.log('❌ TEST COURSE NOT VISIBLE TO STUDENT');
        console.log('   Available courses:', data.data.courses.map(c => c.title).join(', '));
        return false;
      }
    } else {
      console.log('❌ Student view courses failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Student view courses error:', error.message);
    return false;
  }
}

async function studentViewCourseDetails() {
  console.log('\n📖 Student viewing course details...');
  
  try {
    const response = await fetch(`${API_URL}/student/courses/${testCourseId}`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Student can view course details');
      console.log('   Course:', data.data.course.title);
      console.log('   Instructor:', data.data.course.instructor_id?.name);
      console.log('   Sections:', data.data.sections.length);
      console.log('   Is Enrolled:', data.data.isEnrolled);
      return true;
    } else {
      console.log('❌ Student view course details failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Student view course details error:', error.message);
    return false;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    if (testCourseId) {
      await Course.deleteOne({ _id: testCourseId });
      console.log('✅ Test course deleted');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.log('⚠️  Cleanup error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Organization Isolation Test');
  console.log('API URL:', API_URL);
  console.log('='.repeat(60));

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Setup
  const setupSuccess = await setupTestAccounts();
  if (!setupSuccess) {
    console.log('\n❌ Setup failed, cannot proceed');
    process.exit(1);
  }

  // Run tests
  const tests = [
    { name: 'Instructor Login', fn: loginInstructor },
    { name: 'Student Login', fn: loginStudent },
    { name: 'Create Course', fn: createTestCourse },
    { name: 'Publish Course', fn: publishCourse },
    { name: 'Student View Courses', fn: studentViewCourses },
    { name: 'Student View Course Details', fn: studentViewCourseDetails }
  ];

  for (const test of tests) {
    results.total++;
    const success = await test.fn();
    if (success) {
      results.passed++;
    } else {
      results.failed++;
      break; // Stop on first failure
    }
  }

  // Cleanup
  await cleanup();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('='.repeat(60));

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!');
    console.log('✅ Organization isolation is working correctly');
    console.log('✅ Courses created by instructors are visible to students in the same organization');
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
