require('dotenv').config();
const mongoose = require('mongoose');
const { Course, User } = require('./src/models');

async function debugLiveClassIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the instructor user (from the screenshot, email is instructor@test.com or similar)
    const instructors = await User.find({ role: 'instructor' }).select('_id name email organization_id role');
    
    console.log('📋 Instructors in Database:');
    console.log('='.repeat(80));
    instructors.forEach((instructor, index) => {
      console.log(`\n${index + 1}. ${instructor.name} (${instructor.email})`);
      console.log(`   ID: ${instructor._id}`);
      console.log(`   Organization ID: ${instructor.organization_id || 'NULL/UNDEFINED'}`);
      console.log(`   Role: ${instructor.role}`);
    });

    // Get all courses
    const courses = await Course.find({})
      .select('_id title organization_id instructor_id status')
      .populate('instructor_id', 'name email')
      .populate('organization_id', 'name');

    console.log('\n\n📚 Courses in Database:');
    console.log('='.repeat(80));
    courses.forEach((course, index) => {
      console.log(`\n${index + 1}. ${course.title}`);
      console.log(`   Course ID: ${course._id}`);
      console.log(`   Organization ID: ${course.organization_id?._id || course.organization_id || 'NULL/UNDEFINED'}`);
      console.log(`   Organization Name: ${course.organization_id?.name || 'N/A'}`);
      console.log(`   Instructor: ${course.instructor_id?.name || 'N/A'} (${course.instructor_id?.email || 'N/A'})`);
      console.log(`   Status: ${course.status}`);
    });

    // Check for organization mismatches
    console.log('\n\n🔍 Checking for Organization Mismatches:');
    console.log('='.repeat(80));
    
    for (const course of courses) {
      if (course.instructor_id) {
        const instructor = await User.findById(course.instructor_id._id);
        
        const courseOrgId = course.organization_id?._id?.toString() || course.organization_id?.toString() || null;
        const instructorOrgId = instructor?.organization_id?.toString() || null;
        
        if (courseOrgId && instructorOrgId && courseOrgId !== instructorOrgId) {
          console.log(`\n⚠️  MISMATCH FOUND:`);
          console.log(`   Course: ${course.title}`);
          console.log(`   Course Org ID: ${courseOrgId}`);
          console.log(`   Instructor: ${instructor.name}`);
          console.log(`   Instructor Org ID: ${instructorOrgId}`);
        }
      }
    }

    console.log('\n\n✅ Diagnosis Complete');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

debugLiveClassIssue();
