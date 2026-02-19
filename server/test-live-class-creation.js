require('dotenv').config();
const mongoose = require('mongoose');
const { Course, User, LiveClass } = require('./src/models');

async function testLiveClassCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find an instructor
    const instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) {
      console.error('❌ No instructor found');
      return;
    }

    console.log('👤 Instructor:', {
      id: instructor._id,
      name: instructor.name,
      email: instructor.email,
      organization_id: instructor.organization_id,
      role: instructor.role
    });

    // Find a course by this instructor
    const course = await Course.findOne({
      instructor_id: instructor._id,
      organization_id: instructor.organization_id,
      is_deleted: false
    });

    if (!course) {
      console.error('❌ No course found for this instructor');
      return;
    }

    console.log('\n📚 Course:', {
      id: course._id,
      title: course.title,
      organization_id: course.organization_id,
      instructor_id: course.instructor_id,
      status: course.status
    });

    // Try to create a live class
    console.log('\n🎥 Creating live class...');
    
    const liveClassData = {
      organization_id: instructor.organization_id,
      course_id: course._id,
      instructor_id: instructor._id,
      title: 'Test Live Class',
      description: 'This is a test live class',
      scheduled_date: new Date('2026-03-01T10:00:00Z'),
      start_time: '10:00',
      duration_minutes: 60,
      status: 'scheduled'
    };

    console.log('📝 Live class data:', liveClassData);

    const liveClass = await LiveClass.create(liveClassData);

    console.log('\n✅ Live class created successfully!');
    console.log('Live class ID:', liveClass._id);
    console.log('Meeting URL:', liveClass.meeting_url);

    // Clean up - delete the test live class
    await LiveClass.findByIdAndDelete(liveClass._id);
    console.log('\n🗑️  Test live class deleted');

    await mongoose.disconnect();
    console.log('\n✅ Test completed successfully');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    await mongoose.disconnect();
  }
}

testLiveClassCreation();
