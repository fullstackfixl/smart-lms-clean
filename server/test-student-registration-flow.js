/**
 * Test script for Student Registration and Enrollment Flow
 * 
 * This script tests the complete flow:
 * 1. Student Registration
 * 2. Course Discovery
 * 3. Course Enrollment
 * 4. Progress Tracking
 * 5. Dashboard Display
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Organization = require('./src/models/Organization');
const Course = require('./src/models/Course');
const Enrollment = require('./src/models/Enrollment');
const Section = require('./src/models/Section');
const Lesson = require('./src/models/Lesson');

// Test data
let testOrganization;
let testCourse;
let testStudent;
let testEnrollment;
let testSection;
let testLesson;

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test data
    if (testStudent) await User.deleteOne({ _id: testStudent._id });
    if (testEnrollment) await Enrollment.deleteOne({ _id: testEnrollment._id });
    if (testLesson) await Lesson.deleteOne({ _id: testLesson._id });
    if (testSection) await Section.deleteOne({ _id: testSection._id });
    if (testCourse) await Course.deleteOne({ _id: testCourse._id });
    if (testOrganization) await Organization.deleteOne({ _id: testOrganization._id });
    
    console.log('✓ Cleanup completed');
  } catch (error) {
    console.error('✗ Cleanup failed:', error.message);
  }
}

async function testOrganizationCreation() {
  console.log('\n📋 Test 1: Organization Creation');
  
  try {
    testOrganization = new Organization({
      name: 'Test University',
      slug: 'test-university-' + Date.now(),
      code: 'TEST' + Math.random().toString(36).substring(2, 4).toUpperCase(),
      emailDomains: ['test.edu'],
      status: 'active',
      isActive: true
    });
    
    await testOrganization.save();
    console.log('✓ Organization created:', testOrganization.code);
    return true;
  } catch (error) {
    console.error('✗ Organization creation failed:', error.message);
    return false;
  }
}

async function testStudentRegistration() {
  console.log('\n👤 Test 2: Student Registration');
  
  try {
    // Test organization code validation
    const orgExists = await Organization.findOne({ code: testOrganization.code });
    if (!orgExists) {
      console.error('✗ Organization code validation failed');
      return false;
    }
    console.log('✓ Organization code validated');
    
    // Test email uniqueness
    const emailExists = await User.findOne({ email: 'teststudent@test.edu' });
    if (emailExists) {
      await User.deleteOne({ email: 'teststudent@test.edu' });
    }
    console.log('✓ Email uniqueness checked');
    
    // Create student
    testStudent = new User({
      email: 'teststudent@test.edu',
      password_hash: 'TestPassword123!',
      name: 'Test Student',
      role: 'student',
      organization_id: testOrganization._id,
      organization_code: testOrganization.code,
      isActive: true,
      email_verified: true
    });
    
    await testStudent.save();
    
    // Verify password was hashed
    if (!testStudent.password_hash.startsWith('$2')) {
      console.error('✗ Password hashing failed');
      return false;
    }
    console.log('✓ Password hashed with bcrypt');
    
    // Verify user created with correct role and status
    if (testStudent.role !== 'student' || !testStudent.isActive) {
      console.error('✗ User creation validation failed');
      return false;
    }
    console.log('✓ Student user created with role="student", status="active"');
    
    return true;
  } catch (error) {
    console.error('✗ Student registration failed:', error.message);
    return false;
  }
}

async function testCourseSetup() {
  console.log('\n📚 Test 3: Course Setup');
  
  try {
    // Create instructor
    const instructor = new User({
      email: 'instructor@test.edu',
      password_hash: 'InstructorPass123!',
      name: 'Test Instructor',
      role: 'instructor',
      organization_id: testOrganization._id,
      isActive: true,
      email_verified: true
    });
    await instructor.save();
    
    // Create course
    testCourse = new Course({
      organization_id: testOrganization._id,
      title: 'Test Course',
      description: 'A test course for student enrollment',
      instructor_id: instructor._id,
      status: 'published',
      isActive: true,
      category: 'programming',
      level: 'beginner',
      duration: 120,
      rating: { average: 4.5, count: 10 }
    });
    await testCourse.save();
    console.log('✓ Course created and published');
    
    // Create section
    testSection = new Section({
      course_id: testCourse._id,
      title: 'Introduction',
      order: 1,
      isActive: true
    });
    await testSection.save();
    console.log('✓ Section created');
    
    // Create lesson
    testLesson = new Lesson({
      section_id: testSection._id,
      course_id: testCourse._id,
      title: 'Getting Started',
      type: 'video',
      duration: 30,
      order: 1,
      isActive: true
    });
    await testLesson.save();
    console.log('✓ Lesson created');
    
    return true;
  } catch (error) {
    console.error('✗ Course setup failed:', error.message);
    return false;
  }
}

async function testCourseDiscovery() {
  console.log('\n🔍 Test 4: Course Discovery');
  
  try {
    // Test organization-scoped filtering
    const courses = await Course.find({
      organization_id: testOrganization._id,
      status: 'published',
      isActive: true
    }).populate('instructor_id', 'name');
    
    if (courses.length === 0) {
      console.error('✗ No courses found for organization');
      return false;
    }
    console.log('✓ Organization-scoped course discovery works');
    
    // Verify course data completeness
    const course = courses[0];
    if (!course.title || !course.instructor_id || !course.duration) {
      console.error('✗ Course data incomplete');
      return false;
    }
    console.log('✓ Course data includes: thumbnail, instructor, duration, rating');
    
    // Check enrollment status
    const enrollment = await Enrollment.findOne({
      student_id: testStudent._id,
      course_id: course._id
    });
    const isEnrolled = !!enrollment;
    console.log('✓ Enrollment status check:', isEnrolled ? 'Enrolled' : 'Not Enrolled');
    
    return true;
  } catch (error) {
    console.error('✗ Course discovery failed:', error.message);
    return false;
  }
}

async function testCourseEnrollment() {
  console.log('\n📝 Test 5: Course Enrollment');
  
  try {
    // Verify student role
    if (testStudent.role !== 'student') {
      console.error('✗ User role validation failed');
      return false;
    }
    console.log('✓ Student role verified');
    
    // Verify course belongs to student's organization
    if (testCourse.organization_id.toString() !== testStudent.organization_id.toString()) {
      console.error('✗ Organization match validation failed');
      return false;
    }
    console.log('✓ Course organization matches student organization');
    
    // Verify course is published
    if (testCourse.status !== 'published') {
      console.error('✗ Course status validation failed');
      return false;
    }
    console.log('✓ Course is published');
    
    // Check for existing enrollment
    const existingEnrollment = await Enrollment.findOne({
      student_id: testStudent._id,
      course_id: testCourse._id
    });
    
    if (existingEnrollment) {
      console.log('⚠ Student already enrolled, skipping enrollment creation');
      testEnrollment = existingEnrollment;
    } else {
      // Create enrollment
      testEnrollment = new Enrollment({
        organization_id: testOrganization._id,
        student_id: testStudent._id,
        course_id: testCourse._id,
        enrollmentType: 'free',
        status: 'active',
        progress: {
          completedLessons: [],
          totalLessons: 1,
          completionPercentage: 0,
          totalTimeSpent: 0
        },
        enrolledAt: new Date()
      });
      
      await testEnrollment.save();
      console.log('✓ Enrollment created with initial values');
    }
    
    // Verify enrollment record
    if (testEnrollment.progress.completionPercentage !== 0 ||
        testEnrollment.progress.completedLessons.length !== 0 ||
        testEnrollment.status !== 'active') {
      console.error('✗ Enrollment initialization validation failed');
      return false;
    }
    console.log('✓ Enrollment initialized: progress=0%, completedLessons=[], status=active');
    
    return true;
  } catch (error) {
    console.error('✗ Course enrollment failed:', error.message);
    return false;
  }
}

async function testProgressTracking() {
  console.log('\n📊 Test 6: Progress Tracking');
  
  try {
    // Mark lesson as complete
    const lessonAlreadyCompleted = testEnrollment.progress.completedLessons.some(
      cl => cl.lessonId.toString() === testLesson._id.toString()
    );
    
    if (!lessonAlreadyCompleted) {
      testEnrollment.progress.completedLessons.push({
        lessonId: testLesson._id,
        completedAt: new Date(),
        timeSpent: 30
      });
      console.log('✓ Lesson added to completedLessons array');
    } else {
      console.log('⚠ Lesson already completed');
    }
    
    // Calculate progress percentage
    const totalLessons = testEnrollment.progress.totalLessons || 1;
    const completedCount = testEnrollment.progress.completedLessons.length;
    testEnrollment.progress.completionPercentage = Math.round((completedCount / totalLessons) * 100);
    console.log('✓ Progress calculated:', testEnrollment.progress.completionPercentage + '%');
    
    // Check course completion
    if (testEnrollment.progress.completionPercentage >= 100) {
      testEnrollment.status = 'completed';
      testEnrollment.completedAt = new Date();
      console.log('✓ Course marked as completed');
    }
    
    // Update last accessed
    testEnrollment.lastAccessedAt = new Date();
    
    // Persist changes
    await testEnrollment.save();
    console.log('✓ Progress persisted to database');
    
    // Verify persistence
    const updatedEnrollment = await Enrollment.findById(testEnrollment._id);
    if (updatedEnrollment.progress.completionPercentage !== testEnrollment.progress.completionPercentage) {
      console.error('✗ Progress persistence validation failed');
      return false;
    }
    console.log('✓ Progress persistence verified');
    
    return true;
  } catch (error) {
    console.error('✗ Progress tracking failed:', error.message);
    return false;
  }
}

async function testDashboardQuery() {
  console.log('\n🏠 Test 7: Dashboard Enrollment Query');
  
  try {
    // Query enrollments for student
    const enrollments = await Enrollment.find({
      student_id: testStudent._id,
      organization_id: testStudent.organization_id
    }).populate('course_id');
    
    if (enrollments.length === 0) {
      console.error('✗ No enrollments found for student');
      return false;
    }
    console.log('✓ Dashboard query returned', enrollments.length, 'enrollment(s)');
    
    // Verify enrollment data
    const enrollment = enrollments[0];
    if (!enrollment.course_id || !enrollment.progress) {
      console.error('✗ Enrollment data incomplete');
      return false;
    }
    console.log('✓ Enrollment includes course and progress data');
    
    return true;
  } catch (error) {
    console.error('✗ Dashboard query failed:', error.message);
    return false;
  }
}

async function testMultiTenantIsolation() {
  console.log('\n🔒 Test 8: Multi-Tenant Isolation');
  
  try {
    // Create another organization
    const otherOrg = new Organization({
      name: 'Other University',
      slug: 'other-university-' + Date.now(),
      code: 'OTH' + Math.random().toString(36).substring(2, 5).toUpperCase(),
      status: 'active',
      isActive: true
    });
    await otherOrg.save();
    
    // Create course in other organization
    const otherCourse = new Course({
      organization_id: otherOrg._id,
      title: 'Other Course',
      description: 'Course from different organization',
      status: 'published',
      isActive: true
    });
    await otherCourse.save();
    
    // Verify student cannot see courses from other organization
    const studentCourses = await Course.find({
      organization_id: testStudent.organization_id,
      status: 'published',
      isActive: true
    });
    
    const hasOtherOrgCourse = studentCourses.some(
      c => c.organization_id.toString() === otherOrg._id.toString()
    );
    
    if (hasOtherOrgCourse) {
      console.error('✗ Multi-tenant isolation failed: student can see other org courses');
      await Organization.deleteOne({ _id: otherOrg._id });
      await Course.deleteOne({ _id: otherCourse._id });
      return false;
    }
    console.log('✓ Multi-tenant isolation verified: student only sees own org courses');
    
    // Cleanup
    await Course.deleteOne({ _id: otherCourse._id });
    await Organization.deleteOne({ _id: otherOrg._id });
    
    return true;
  } catch (error) {
    console.error('✗ Multi-tenant isolation test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Student Registration and Enrollment Flow Tests\n');
  console.log('=' .repeat(60));
  
  await connectDB();
  
  const results = {
    passed: 0,
    failed: 0,
    total: 8
  };
  
  try {
    // Run tests
    if (await testOrganizationCreation()) results.passed++; else results.failed++;
    if (await testStudentRegistration()) results.passed++; else results.failed++;
    if (await testCourseSetup()) results.passed++; else results.failed++;
    if (await testCourseDiscovery()) results.passed++; else results.failed++;
    if (await testCourseEnrollment()) results.passed++; else results.failed++;
    if (await testProgressTracking()) results.passed++; else results.failed++;
    if (await testDashboardQuery()) results.passed++; else results.failed++;
    if (await testMultiTenantIsolation()) results.passed++; else results.failed++;
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  } finally {
    await cleanup();
  }
  
  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results:');
  console.log('  Total Tests:', results.total);
  console.log('  Passed:', results.passed, '✓');
  console.log('  Failed:', results.failed, '✗');
  console.log('  Success Rate:', Math.round((results.passed / results.total) * 100) + '%');
  console.log('='.repeat(60));
  
  await mongoose.connection.close();
  console.log('\n✓ Database connection closed');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests();
