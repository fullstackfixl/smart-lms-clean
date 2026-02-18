const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const { Course, Enrollment } = require('./src/models');

async function testStudentDashboard() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const orgId = new mongoose.Types.ObjectId('69903d23c57a679fcca7b9cd');
    const studentId = new mongoose.Types.ObjectId('69905a3acf36b63e5d9b607a');

    console.log('🔍 Testing Recommendations Query:');
    const recommendations = await Course.aggregate([
      {
        $match: {
          organization_id: orgId,
          status: 'published',
          is_deleted: false,
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'enrollments',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$course_id', '$$courseId'] },
                    { $eq: ['$student_id', studentId] }
                  ]
                }
              }
            }
          ],
          as: 'userEnrollment'
        }
      },
      {
        $match: {
          userEnrollment: { $size: 0 }
        }
      },
      {
        $lookup: {
          from: 'sections',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: { 
                $expr: { $eq: ['$course_id', '$$courseId'] },
                isActive: true 
              } 
            },
            {
              $lookup: {
                from: 'lessons',
                let: { sectionId: '$_id' },
                pipeline: [
                  { 
                    $match: { 
                      $expr: { $eq: ['$section_id', '$$sectionId'] },
                      isActive: true 
                    } 
                  }
                ],
                as: 'lessons'
              }
            }
          ],
          as: 'sections'
        }
      },
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'course_id',
          as: 'enrollments'
        }
      },
      {
        $addFields: {
          enrollmentCount: { $size: '$enrollments' },
          totalLessons: {
            $sum: {
              $map: {
                input: '$sections',
                as: 'section',
                in: { $size: '$$section.lessons' }
              }
            }
          }
        }
      },
      {
        $match: {
          totalLessons: { $gt: 0 }
        }
      },
      { $sort: { enrollmentCount: -1, createdAt: -1 } },
      { $limit: 5 },
      {
        $project: {
          title: 1,
          description: 1,
          thumbnail: 1,
          category: 1,
          level: 1,
          enrollmentCount: 1,
          totalLessons: 1
        }
      }
    ]);

    console.log(`Found ${recommendations.length} recommended courses:\n`);
    recommendations.forEach(course => {
      console.log(`  📚 ${course.title}`);
      console.log(`     Category: ${course.category}`);
      console.log(`     Level: ${course.level}`);
      console.log(`     Lessons: ${course.totalLessons}`);
      console.log(`     Enrollments: ${course.enrollmentCount}\n`);
    });

    if (recommendations.length === 0) {
      console.log('❌ No courses found in recommendations!');
      console.log('   This could mean:');
      console.log('   1. Student is already enrolled in all courses');
      console.log('   2. No courses have lessons/sections');
      console.log('   3. No published courses in organization\n');
      
      // Check if student is enrolled
      const enrollments = await Enrollment.find({
        student_id: studentId,
        organization_id: orgId
      });
      console.log(`   Student has ${enrollments.length} enrollments`);
      
      // Check total courses
      const totalCourses = await Course.countDocuments({
        organization_id: orgId,
        status: 'published',
        is_deleted: false,
        isActive: true
      });
      console.log(`   Total published courses: ${totalCourses}`);
    } else {
      console.log('✅ Recommendations query working correctly!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testStudentDashboard();
