const mongoose = require('mongoose');
const Course = require('../models/Course');
const User = require('../models/User');
const GamificationPoints = require('../models/GamificationPoints');
require('dotenv').config();

async function seedPublicData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if public data already exists
    const existingCourses = await Course.countDocuments({ organization_id: null });
    const existingStudents = await User.countDocuments({ role: 'public_student', organization_id: null });
    
    if (existingCourses >= 8 && existingStudents >= 10) {
      console.log(`✅ Public data already exists (${existingCourses} courses, ${existingStudents} students)`);
      console.log('Skipping seed...');
      process.exit(0);
    }
    
    console.log(`Found ${existingCourses} courses and ${existingStudents} students, continuing seed...`);

    // Create a public instructor (no organization)
    let publicInstructor = await User.findOne({ email: 'instructor@public.com' });
    if (!publicInstructor) {
      publicInstructor = await User.create({
        email: 'instructor@public.com',
        password: 'password123',
        role: 'public_student', // Using public_student as placeholder
        organization_id: null,
        profile: {
          fullName: 'John Doe'
        }
      });
      console.log('Created public instructor');
    } else {
      console.log('Public instructor already exists');
    }

    // Create public courses
    const publicCourses = [
      {
        organization_id: null,
        title: 'Introduction to Python Programming',
        description: 'Learn Python from scratch. Perfect for beginners who want to start their programming journey.',
        price: 0,
        category: 'programming',
        level: 'beginner',
        status: 'published',
        instructor_id: publicInstructor._id,
        isPublic: true,
        isActive: true,
        enrollmentCount: 1234,
        rating: { average: 4.5, count: 120 }
      },
      {
        organization_id: null,
        title: 'Web Development Bootcamp',
        description: 'Master HTML, CSS, JavaScript, and modern web frameworks. Build real-world projects.',
        price: 49,
        category: 'programming',
        level: 'intermediate',
        status: 'published',
        instructor_id: publicInstructor._id,
        isPublic: true,
        isActive: true,
        enrollmentCount: 856,
        rating: { average: 4.8, count: 95 }
      },
      {
        organization_id: null,
        title: 'Digital Marketing Fundamentals',
        description: 'Learn SEO, social media marketing, content marketing, and analytics.',
        price: 29,
        category: 'marketing',
        level: 'beginner',
        status: 'published',
        instructor_id: publicInstructor._id,
        isPublic: true,
        isActive: true,
        enrollmentCount: 642,
        rating: { average: 4.3, count: 78 }
      },
      {
        organization_id: null,
        title: 'Graphic Design Masterclass',
        description: 'Master Adobe Photoshop, Illustrator, and design principles.',
        price: 39,
        category: 'design',
        level: 'intermediate',
        status: 'published',
        instructor_id: publicInstructor._id,
        isPublic: true,
        isActive: true,
        enrollmentCount: 523,
        rating: { average: 4.6, count: 67 }
      },
      {
        organization_id: null,
        title: 'Business Strategy & Management',
        description: 'Learn strategic planning, leadership, and business operations.',
        price: 59,
        category: 'business',
        level: 'advanced',
        status: 'published',
        instructor_id: publicInstructor._id,
        isPublic: true,
        isActive: true,
        enrollmentCount: 412,
        rating: { average: 4.7, count: 54 }
      },
      {
        organization_id: null,
        title: 'Photography for Beginners',
        description: 'Learn camera basics, composition, lighting, and photo editing.',
        price: 0,
        category: 'photography',
        level: 'beginner',
        status: 'published',
        instructor_id: publicInstructor._id,
        isPublic: true,
        isActive: true,
        enrollmentCount: 789,
        rating: { average: 4.4, count: 89 }
      },
      {
        organization_id: null,
        title: 'Data Science with Python',
        description: 'Learn data analysis, visualization, and machine learning basics.',
        price: 79,
        category: 'programming',
        level: 'advanced',
        status: 'published',
        instructor_id: publicInstructor._id,
        isPublic: true,
        isActive: true,
        enrollmentCount: 345,
        rating: { average: 4.9, count: 42 }
      },
      {
        organization_id: null,
        title: 'Spanish Language Course',
        description: 'Learn Spanish from beginner to intermediate level with native speakers.',
        price: 0,
        category: 'language',
        level: 'beginner',
        status: 'published',
        instructor_id: publicInstructor._id,
        isPublic: true,
        isActive: true,
        enrollmentCount: 967,
        rating: { average: 4.2, count: 103 }
      }
    ];

    if (existingCourses < 8) {
      await Course.insertMany(publicCourses);
      console.log('Created 8 public courses');
    } else {
      console.log('Public courses already exist, skipping...');
    }

    // Create public students for leaderboard
    const publicStudents = [];
    const names = [
      'Alice Johnson', 'Bob Smith', 'Carol White', 'David Brown', 'Emma Davis',
      'Frank Wilson', 'Grace Lee', 'Henry Taylor', 'Ivy Martinez', 'Jack Anderson'
    ];

    for (let i = 0; i < 10; i++) {
      const email = `student${i + 1}@gmail.com`;
      
      // Check if student already exists
      let student = await User.findOne({ email });
      
      if (!student) {
        student = await User.create({
          email,
          password: 'password123',
          role: 'public_student',
          organization_id: null,
          profile: {
            fullName: names[i]
          }
        });
        console.log(`Created student: ${email}`);
      } else {
        console.log(`Student already exists: ${email}`);
      }
      
      publicStudents.push(student);

      // Check if points already exist
      const existingPoints = await GamificationPoints.findOne({ user_id: student._id });
      
      if (!existingPoints) {
        // Add gamification points
        const points = 2500 - (i * 100); // Descending points
        await GamificationPoints.create({
          user_id: student._id,
          organization_id: null,
          activity_type: 'course_completion',
          points_earned: points,
          activity_title: 'Course Completion Bonus',
          activity_description: 'Points earned from completing courses'
        });
        console.log(`Added ${points} points for ${email}`);
      }
    }

    console.log('Created 10 public students with points');

    console.log('\n✅ Seed data created successfully!');
    console.log('\nPublic Instructor:');
    console.log('Email: instructor@public.com');
    console.log('Password: password123');
    console.log('\nPublic Students: student1@gmail.com to student10@gmail.com');
    console.log('Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedPublicData();
