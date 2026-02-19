/**
 * Check Enrollment Course References
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const STUDENT_EMAIL = 'student@test.com';

async function checkEnrollmentCourses() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Load models
    const User = require('./src/models/User');
    const Course = require('./src/models/Course');
    const Enrollment = require('./src/models/Enrollment');
    
    // Get student
    const student = await User.findOne({ email: STUDENT_EMAIL });
    console.log(`\n📝 Student: ${student.email} (${student._id})`);
    
    // Get enrollments WITHOUT populate
    const enrollments = await Enrollment.find({ student_id: student._id }).lean();
    console.log(`\n📚 Found ${enrollments.length} enrollments`);
    
    for (const enrollment of enrollments) {
      console.log(`\n--- Enrollment ${enrollment._id} ---`);
      console.log(`Course ID in enrollment: ${enrollment.course_id}`);
      
      if (enrollment.course_id) {
        // Check if course exists
        const course = await Course.findById(enrollment.course_id);
        if (course) {
          console.log(`✅ Course exists: "${course.title}" (${course.status})`);
        } else {
          console.log(`❌ Course NOT FOUND - this is a broken reference!`);
          console.log(`   Deleting broken enrollment...`);
          await Enrollment.deleteOne({ _id: enrollment._id });
          console.log(`   ✅ Deleted`);
        }
      } else {
        console.log(`❌ Course ID is null`);
        console.log(`   Deleting null enrollment...`);
        await Enrollment.deleteOne({ _id: enrollment._id });
        console.log(`   ✅ Deleted`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkEnrollmentCourses();
