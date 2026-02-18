const mongoose = require('mongoose');
require('dotenv').config();

const Course = require('./src/models/Course');
const Section = require('./src/models/Section');
const Lesson = require('./src/models/Lesson');
const Enrollment = require('./src/models/Enrollment');
const User = require('./src/models/User');

async function testStudentFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find test student
    const student = await User.findOne({ email: 'student1@test.com' });
    if (!student) {
      console.log('❌ Test student not found');
      process.exit(1);
    }
    console.log(`📚 Testing with student: ${student.email}`);
    console.log(`   Organization: ${student.organization_id}\n`);

    // 1. Check published courses in student's organization
    const publishedCourses = await Course.find({
      organization_id: student.organization_id,
      status: 'published',
      isActive: true
    }).populate('instructor_id', 'name');

    console.log(`📖 Published courses in organization: ${publishedCourses.length}`);
    publishedCourses.forEach(course => {
      console.log(`   - ${course.title} (${course.status})`);
      console.log(`     Instructor: ${course.instructor_id?.name || 'Unknown'}`);
    });
    console.log('');

    if (publishedCourses.length === 0) {
      console.log('❌ No published courses found!');
      console.log('   Run: node publish-test-course.js');
      process.exit(1);
    }

    const testCourse = publishedCourses[0];

    // 2. Check course sections and lessons
    const sections = await Section.find({ 
      course_id: testCourse._id, 
      isActive: true 
    }).sort({ order: 1 });

    console.log(`📑 Course sections: ${sections.length}`);
    
    let totalLessons = 0;
    for (const section of sections) {
      const lessons = await Lesson.find({ 
        section_id: section._id, 
        isActive: true 
      }).sort({ order: 1 });
      
      totalLessons += lessons.length;
      console.log(`   Section: ${section.title}`);
      console.log(`   Lessons: ${lessons.length}`);
      lessons.forEach(lesson => {
        console.log(`     - ${lesson.title} (${lesson.type})`);
      });
    }
    console.log(`   Total lessons: ${totalLessons}\n`);

    // 3. Check enrollment status
    const existingEnrollment = await Enrollment.findOne({
      student_id: student._id,
      course_id: testCourse._id
    });

    if (existingEnrollment) {
      console.log(`✅ Student already enrolled in course`);
      console.log(`   Enrollment ID: ${existingEnrollment._id}`);
      console.log(`   Status: ${existingEnrollment.status}`);
      console.log(`   Progress: ${existingEnrollment.progress.completionPercentage}%`);
      console.log(`   Completed lessons: ${existingEnrollment.progress.completedLessons.length}/${existingEnrollment.progress.totalLessons}`);
    } else {
      console.log(`ℹ️  Student not enrolled yet`);
      console.log(`   Course is ready for enrollment`);
    }

    console.log('\n✅ Student flow test complete!');
    console.log('\nNext steps:');
    console.log('1. Login as student: student1@test.com / password123');
    console.log('2. Go to /student/catalog or /student/courses');
    console.log('3. Click on a course to view details');
    console.log('4. Click "Enroll Now" button');
    console.log('5. View enrolled courses in /student/dashboard');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testStudentFlow();
