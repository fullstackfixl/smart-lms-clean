/**
 * Test Student Course Visibility
 * Verify students can see all published courses from their organization
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const INSTRUCTOR_EMAIL = 'instructor@test.com';
const STUDENT_EMAIL = 'student@test.com';

async function testStudentCourseVisibility() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Load models
    const User = require('./src/models/User');
    const Course = require('./src/models/Course');
    const Enrollment = require('./src/models/Enrollment');
    
    // Get instructor and student
    const instructor = await User.findOne({ email: INSTRUCTOR_EMAIL });
    const student = await User.findOne({ email: STUDENT_EMAIL });
    
    if (!instructor || !student) {
      console.log('❌ Instructor or student not found');
      return;
    }
    
    console.log(`\n📝 Instructor: ${instructor.email}`);
    console.log(`📝 Student: ${student.email}`);
    console.log(`📝 Organization: ${instructor.organization_id}`);
    
    // Check if they're in the same organization
    if (instructor.organization_id.toString() !== student.organization_id.toString()) {
      console.log('\n❌ Instructor and student are NOT in the same organization!');
      return;
    }
    
    console.log('\n✅ Instructor and student are in the SAME organization');
    
    // Get all courses created by instructor
    const instructorCourses = await Course.find({
      instructor_id: instructor._id
    });
    
    console.log(`\n📚 Instructor has created ${instructorCourses.length} courses:`);
    instructorCourses.forEach((course, i) => {
      console.log(`   ${i + 1}. "${course.title}" - Status: ${course.status}`);
    });
    
    // Get published courses from the organization
    const publishedCourses = await Course.find({
      organization_id: instructor.organization_id,
      status: 'published',
      isActive: true
    });
    
    console.log(`\n📖 Published courses in organization: ${publishedCourses.length}`);
    publishedCourses.forEach((course, i) => {
      console.log(`   ${i + 1}. "${course.title}" by ${course.instructor_id}`);
    });
    
    // Check what student can see (simulate the API endpoint)
    const studentVisibleCourses = await Course.find({
      organization_id: student.organization_id,
      status: 'published',
      isActive: true
    }).populate('instructor_id', 'name email');
    
    console.log(`\n👁️  Student can see ${studentVisibleCourses.length} courses:`);
    studentVisibleCourses.forEach((course, i) => {
      console.log(`   ${i + 1}. "${course.title}"`);
      console.log(`      Instructor: ${course.instructor_id?.name || course.instructor_id?.email}`);
      console.log(`      Status: ${course.status}`);
    });
    
    // Check student enrollments
    const enrollments = await Enrollment.find({
      student_id: student._id
    }).populate('course_id', 'title status');
    
    console.log(`\n📝 Student enrollments: ${enrollments.length}`);
    enrollments.forEach((enrollment, i) => {
      console.log(`   ${i + 1}. "${enrollment.course_id?.title || 'DELETED COURSE'}"`);
      console.log(`      Status: ${enrollment.status}`);
    });
    
    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Same Organization: Yes`);
    console.log(`📚 Instructor Courses: ${instructorCourses.length}`);
    console.log(`📖 Published Courses: ${publishedCourses.length}`);
    console.log(`👁️  Student Can See: ${studentVisibleCourses.length}`);
    console.log(`📝 Student Enrolled: ${enrollments.length}`);
    
    if (studentVisibleCourses.length === 0) {
      console.log(`\n⚠️  WARNING: Student cannot see any courses!`);
      console.log(`   Reason: No published courses in the organization`);
      console.log(`   Solution: Publish instructor courses`);
    } else {
      console.log(`\n✅ SUCCESS: Student can see published courses!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testStudentCourseVisibility();
