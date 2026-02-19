/**
 * Create Test Course and Enroll Student
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const INSTRUCTOR_EMAIL = 'instructor@test.com';
const STUDENT_EMAIL = 'student@test.com';

async function createTestCourseAndEnroll() {
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
    
    // Check if test course already exists
    let course = await Course.findOne({
      title: 'Complete Web Development Bootcamp',
      instructor_id: instructor._id
    });
    
    if (course) {
      console.log(`\n✅ Test course already exists: "${course.title}"`);
    } else {
      // Create a published test course
      course = await Course.create({
        title: 'Complete Web Development Bootcamp',
        description: 'Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB from scratch. Build real-world projects and become a full-stack developer.',
        instructor_id: instructor._id,
        organization_id: instructor.organization_id,
        category: 'programming',
        level: 'beginner',
        status: 'published', // IMPORTANT: Published so students can see it
        duration: 3600, // 60 hours
        price: 0,
        thumbnail: 'https://res.cloudinary.com/demo/image/upload/v1234567890/course-thumbnail.jpg',
        tags: ['web development', 'javascript', 'react', 'node.js'],
        requirements: ['Basic computer skills', 'Internet connection'],
        learningOutcomes: [
          'Build responsive websites with HTML and CSS',
          'Master JavaScript fundamentals',
          'Create React applications',
          'Build REST APIs with Node.js',
          'Work with MongoDB databases'
        ]
      });
      
      console.log(`\n✅ Created test course: "${course.title}"`);
    }
    
    // Check if student is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student_id: student._id,
      course_id: course._id
    });
    
    if (existingEnrollment) {
      console.log(`\n✅ Student already enrolled in course`);
    } else {
      // Enroll student
      const enrollment = await Enrollment.create({
        student_id: student._id,
        course_id: course._id,
        organization_id: instructor.organization_id,
        enrollmentType: 'free', // Required field
        status: 'active',
        progress: {
          completedLessons: [],
          totalLessons: 0,
          completionPercentage: 0,
          totalTimeSpent: 0,
          averageScore: 0
        }
      });
      
      console.log(`\n✅ Enrolled student in course`);
      console.log(`   Enrollment ID: ${enrollment._id}`);
    }
    
    console.log(`\n📊 Final Status:`);
    console.log(`   Course ID: ${course._id}`);
    console.log(`   Course Title: ${course.title}`);
    console.log(`   Course Status: ${course.status}`);
    console.log(`   Student Enrolled: Yes`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

createTestCourseAndEnroll();
