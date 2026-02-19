/**
 * Check Course Status and Visibility
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkCourseStatus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Course = require('./src/models/Course');
    const User = require('./src/models/User');
    
    // Get all courses
    const courses = await Course.find()
      .populate('instructor_id', 'email name')
      .populate('organization_id', 'name');
    
    console.log(`\n📚 Total Courses: ${courses.length}\n`);
    
    courses.forEach((course, i) => {
      console.log(`${i + 1}. "${course.title}"`);
      console.log(`   Instructor: ${course.instructor_id?.email || 'Unknown'}`);
      console.log(`   Organization: ${course.organization_id?.name || 'Unknown'}`);
      console.log(`   Status: ${course.status}`);
      console.log(`   Published: ${course.status === 'published' ? '✅ YES' : '❌ NO'}`);
      console.log(`   Visible to Students: ${course.status === 'published' ? '✅ YES' : '❌ NO'}`);
      console.log('');
    });
    
    const publishedCount = courses.filter(c => c.status === 'published').length;
    const draftCount = courses.filter(c => c.status === 'draft').length;
    
    console.log('📊 Summary:');
    console.log(`   Published (visible to students): ${publishedCount}`);
    console.log(`   Draft (only instructor can see): ${draftCount}`);
    
    if (draftCount > 0) {
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('   Instructors need to PUBLISH their courses for students to see them!');
      console.log('   Go to Instructor Dashboard → My Courses → Click "Publish" button');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkCourseStatus();
