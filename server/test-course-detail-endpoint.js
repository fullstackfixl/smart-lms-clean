const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const { Course, Section, Lesson, Enrollment, Review } = require('./src/models');

async function testCourseDetail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const courseId = '6992e66672c453cfd773a083';
    const orgId = new mongoose.Types.ObjectId('69903d23c57a679fcca7b9cd');
    const studentId = new mongoose.Types.ObjectId('69905a3acf36b63e5d9b607a');

    console.log('🔍 Testing Course Detail Query:\n');

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log('❌ Invalid course ID');
      return;
    }

    // Find course
    const course = await Course.findOne({
      _id: courseId,
      organization_id: orgId,
      status: 'published',
      is_deleted: false,
      isActive: true
    })
      .populate('instructor_id', 'name email profile')
      .lean();

    if (!course) {
      console.log('❌ Course not found');
      return;
    }

    console.log('📚 Course Found:');
    console.log(`   Title: ${course.title}`);
    console.log(`   Status: ${course.status}`);
    console.log(`   Active: ${course.isActive}`);
    console.log(`   Instructor: ${course.instructor_id.name}\n`);

    // Get sections with lessons
    const sections = await Section.find({
      course_id: courseId,
      organization_id: orgId,
      isActive: true
    })
      .sort({ order: 1 })
      .lean();

    console.log(`📑 Sections: ${sections.length}`);

    const sectionsWithLessons = await Promise.all(
      sections.map(async (section) => {
        const lessons = await Lesson.find({
          section_id: section._id,
          organization_id: orgId,
          isActive: true
        })
          .sort({ order: 1 })
          .select('title description type duration isPreview order')
          .lean();

        console.log(`   Section: ${section.title} (${lessons.length} lessons)`);
        lessons.forEach(lesson => {
          console.log(`     - ${lesson.title} (${lesson.type}, ${lesson.duration}s)`);
});

        return {
          ...section,
          lessons
        };
      })
    );

    // Calculate total duration
    const totalDuration = sectionsWithLessons.reduce((total, section) => {
      return total + section.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
    }, 0);

    console.log(`\n⏱️  Total Duration: ${totalDuration}s`);

    // Get rating stats
    const ratingStats = await Review.calculateCourseRating(courseId);
    console.log(`\n⭐ Rating: ${ratingStats.averageRating} (${ratingStats.totalReviews} reviews)`);

    // Check if enrolled
    const enrollment = await Enrollment.findOne({
      student_id: studentId,
      course_id: courseId,
      organization_id: orgId
    }).lean();

    console.log(`\n📝 Enrollment: ${enrollment ? 'Yes' : 'No'}`);
    if (enrollment) {
      console.log(`   Progress: ${enrollment.progress.completionPercentage}%`);
    }

    // Get total lectures count
    const totalLectures = sectionsWithLessons.reduce((sum, section) => sum + section.lessons.length, 0);
    console.log(`\n📊 Total Lectures: ${totalLectures}`);

    console.log('\n✅ Course detail query working correctly!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testCourseDetail();