/**
 * Debug Enrollment Data Structure
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const STUDENT_EMAIL = 'student@test.com';

async function debugEnrollmentData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Load models
    const User = require('./src/models/User');
    const Course = require('./src/models/Course');
    const Enrollment = require('./src/models/Enrollment');
    
    // Get student
    const student = await User.findOne({ email: STUDENT_EMAIL });
    
    if (!student) {
      console.log('❌ Student not found');
      return;
    }
    
    console.log(`\n📝 Student: ${student.email}`);
    console.log(`   ID: ${student._id}`);
    console.log(`   Organization: ${student.organization_id}`);
    
    // Check for orphaned enrollments FIRST (before populate)
    const orphanedCount = await Enrollment.countDocuments({
      student_id: student._id,
      course_id: null
    });
    
    if (orphanedCount > 0) {
      console.log(`\n⚠️  Found ${orphanedCount} orphaned enrollments (course_id is null)`);
      console.log('Deleting orphaned enrollments...');
      
      const result = await Enrollment.deleteMany({
        student_id: student._id,
        course_id: null
      });
      
      console.log(`✅ Deleted ${result.deletedCount} orphaned enrollments`);
    }
    
    // Get enrollments
    const enrollments = await Enrollment.find({ student_id: student._id })
      .populate('course_id')
      .populate('student_id', 'email profile')
      .lean();
    
    console.log(`\n📚 Enrollments: ${enrollments.length}`);
    
    enrollments.forEach((enrollment, index) => {
      console.log(`\n--- Enrollment ${index + 1} ---`);
      console.log('Enrollment ID:', enrollment._id);
      console.log('Course ID:', enrollment.course_id?._id || 'NULL');
      console.log('Course Title:', enrollment.course_id?.title || 'NULL');
      console.log('Course Status:', enrollment.course_id?.status || 'NULL');
      console.log('Enrollment Status:', enrollment.status);
      console.log('Progress:', enrollment.progress);
      console.log('Created At:', enrollment.createdAt);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugEnrollmentData();
