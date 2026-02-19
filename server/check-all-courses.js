require('dotenv').config();
const mongoose = require('mongoose');
const { Course } = require('./src/models');

async function checkAllCourses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all courses
    const allCourses = await Course.find({})
      .populate('instructor_id', 'name email')
      .populate('organization_id', 'name')
      .select('title status organization_id instructor_id createdAt')
      .sort({ createdAt: -1 });

    console.log(`📚 Total Courses: ${allCourses.length}\n`);

    if (allCourses.length === 0) {
      console.log('⚠️  No courses found in database');
    } else {
      console.log('Course Details:');
      console.log('='.repeat(80));
      
      allCourses.forEach((course, index) => {
        console.log(`\n${index + 1}. ${course.title}`);
        console.log(`   Status: ${course.status}`);
        console.log(`   Organization: ${course.organization_id?.name || 'N/A'}`);
        console.log(`   Instructor: ${course.instructor_id?.name || 'N/A'} (${course.instructor_id?.email || 'N/A'})`);
        console.log(`   Created: ${course.createdAt}`);
      });

      // Summary by status
      const statusCounts = allCourses.reduce((acc, course) => {
        acc[course.status] = (acc[course.status] || 0) + 1;
        return acc;
      }, {});

      console.log('\n' + '='.repeat(80));
      console.log('\n📊 Summary by Status:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

checkAllCourses();
