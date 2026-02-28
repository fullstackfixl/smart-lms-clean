require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');
const Course = require('./src/models/Course');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-lms';

async function seedTestData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing test data to ensure fresh start
    console.log('🗑️ Clearing existing test data...');
    const testOrg = await Organization.findOne({ code: 'TEST001' });
    if (testOrg) {
      await User.deleteMany({ organization_id: testOrg._id });
      await Course.deleteMany({ organization_id: testOrg._id });
      await Organization.deleteOne({ _id: testOrg._id });
      console.log('✅ Cleaned up existing TEST001 data');
    }

    // Create Test Organization
    let org = await Organization.findOne({ code: 'TEST001' });
    if (!org) {
      org = await Organization.create({
        name: 'Test University',
        type: 'COLLEGE',
        subdomain: 'test-uni',
        slug: 'test-university',
        code: 'TEST001',
        domain: 'testuniversity.edu',
        emailDomains: ['testuniversity.edu'],
        address: '123 Test Street, Test City, Test State, Test Country 12345',
        description: 'Test organization for development',
        status: 'active',
        isActive: true,
        settings: {
          require_email_verification: false,
          require_phone_verification: false,
          mfa_required: false,
          features: ['courses', 'live_classes', 'assessments']
        }
      });
      console.log('✅ Created Test Organization:', org.code);
    }

    // Create Org Admin
    const orgAdminExists = await User.findOne({ email: 'orgadmin@test.com' });
    if (!orgAdminExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const orgAdmin = await User.create({
        name: 'Org Admin',
        email: 'orgadmin@test.com',
        password_hash: hashedPassword,
        role: 'org_admin',
        organization_id: org._id,
        isActive: true,
        email_verified: true
      });
      console.log('✅ Created Org Admin:', orgAdmin.email);
    }

    // Create Instructor
    const instructorExists = await User.findOne({ email: 'instructor@test.com' });
    let instructor;
    if (!instructorExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      instructor = await User.create({
        name: 'John Instructor',
        email: 'instructor@test.com',
        password_hash: hashedPassword,
        role: 'instructor',
        organization_id: org._id,
        isActive: true,
        email_verified: true
      });
      console.log('✅ Created Instructor:', instructor.email);
    } else {
      instructor = instructorExists;
    }

    // Create Students
    const studentEmails = ['student1@test.com', 'student2@test.com', 'student3@test.com'];
    for (const email of studentEmails) {
      const studentExists = await User.findOne({ email });
      if (!studentExists) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const student = await User.create({
          name: email.split('@')[0].replace('student', 'Student '),
          email,
          password_hash: hashedPassword,
          role: 'student',
          organization_id: org._id,
          isActive: true,
          email_verified: true
        });
        console.log('✅ Created Student:', student.email);
      }
    }

    // Create Test Courses
    const courseExists = await Course.findOne({ title: 'Introduction to Programming' });
    if (!courseExists) {
      const course1 = await Course.create({
        title: 'Introduction to Programming',
        description: 'Learn the basics of programming with JavaScript',
        instructor_id: instructor._id,
        organization_id: org._id,
        category: 'Programming',
        level: 'beginner',
        duration: 40,
        price: 99.99,
        currency: 'USD',
        language: 'English',
        thumbnail: '',
        status: 'published',
        isPublished: true,
        modules: [
          {
            title: 'Getting Started',
            description: 'Introduction to programming concepts',
            order: 1,
            lessons: [
              {
                title: 'What is Programming?',
                description: 'Understanding programming fundamentals',
                type: 'video',
                content: 'https://example.com/video1.mp4',
                duration: 15,
                order: 1,
                isFree: true
              },
              {
                title: 'Setting Up Your Environment',
                description: 'Install and configure development tools',
                type: 'video',
                content: 'https://example.com/video2.mp4',
                duration: 20,
                order: 2,
                isFree: false
              }
            ]
          },
          {
            title: 'JavaScript Basics',
            description: 'Learn JavaScript fundamentals',
            order: 2,
            lessons: [
              {
                title: 'Variables and Data Types',
                description: 'Understanding variables in JavaScript',
                type: 'video',
                content: 'https://example.com/video3.mp4',
                duration: 25,
                order: 1,
                isFree: false
              }
            ]
          }
        ],
        requirements: ['Basic computer skills', 'Internet connection'],
        learningOutcomes: ['Understand programming concepts', 'Write basic JavaScript code'],
        tags: ['programming', 'javascript', 'beginner']
      });
      console.log('✅ Created Course:', course1.title);

      const course2 = await Course.create({
        title: 'Web Development Fundamentals',
        description: 'Master HTML, CSS, and JavaScript',
        instructor_id: instructor._id,
        organization_id: org._id,
        category: 'Web Development',
        level: 'intermediate',
        duration: 60,
        price: 149.99,
        currency: 'USD',
        language: 'English',
        thumbnail: '',
        status: 'published',
        isPublished: true,
        modules: [
          {
            title: 'HTML Essentials',
            description: 'Learn HTML structure and elements',
            order: 1,
            lessons: [
              {
                title: 'HTML Introduction',
                description: 'What is HTML and why it matters',
                type: 'video',
                content: 'https://example.com/html1.mp4',
                duration: 20,
                order: 1,
                isFree: true
              }
            ]
          }
        ],
        requirements: ['Basic programming knowledge'],
        learningOutcomes: ['Build responsive websites', 'Understand web technologies'],
        tags: ['web', 'html', 'css', 'javascript']
      });
      console.log('✅ Created Course:', course2.title);

      // Create Enrollments
      const Enrollment = require('./src/models/Enrollment');
      const students = await User.find({ role: 'student', organization_id: org._id });

      for (const student of students) {
        await Enrollment.create({
          organization_id: org._id,
          student_id: student._id,
          course_id: course1._id,
          enrollmentType: 'free',
          status: 'active',
          progress: {
            totalLessons: 3,
            completionPercentage: 33
          }
        });
      }
      console.log('✅ Created Enrollments');

      // Create Live Classes
      const LiveClass = require('./src/models/LiveClass');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(10, 0, 0, 0);

      await LiveClass.create({
        organization_id: org._id,
        course_id: course1._id,
        instructor_id: instructor._id,
        title: 'Introduction to JavaScript - Live Session',
        description: 'Interactive session covering JavaScript basics',
        scheduled_date: tomorrow,
        start_time: '14:00',
        duration_minutes: 60,
        max_participants: 50,
        status: 'scheduled',
        recording_enabled: true
      });

      await LiveClass.create({
        organization_id: org._id,
        course_id: course2._id,
        instructor_id: instructor._id,
        title: 'HTML & CSS Workshop',
        description: 'Hands-on workshop for building web pages',
        scheduled_date: nextWeek,
        start_time: '10:00',
        duration_minutes: 90,
        max_participants: 30,
        status: 'scheduled',
        recording_enabled: true
      });
      console.log('✅ Created Live Classes');

      // Create Notifications
      const Notification = require('./src/models/Notification');

      await Notification.create({
        organization_id: org._id,
        recipient_id: instructor._id,
        type: 'live_class_reminder',
        title: 'Upcoming Live Class Tomorrow',
        message: 'You have a live class scheduled for tomorrow at 2:00 PM',
        priority: 'high',
        status: 'pending',
        action_url: '/instructor/live-classes',
        action_text: 'View Details'
      });

      for (const student of students) {
        await Notification.create({
          organization_id: org._id,
          recipient_id: student._id,
          sender_id: instructor._id,
          type: 'general',
          title: 'Welcome to the Course!',
          message: 'Welcome to Introduction to Programming. Start learning today!',
          priority: 'medium',
          status: 'sent'
        });
      }
      console.log('✅ Created Notifications');
    }

    console.log('\n✅ Test data seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Org Admin: orgadmin@test.com / password123');
    console.log('Instructor: instructor@test.com / password123');
    console.log('Student 1: student1@test.com / password123');
    console.log('Student 2: student2@test.com / password123');
    console.log('Student 3: student3@test.com / password123');
    console.log('\nOrganization Code: TEST001');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedTestData();
