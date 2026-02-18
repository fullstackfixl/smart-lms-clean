/**
 * Script to publish the test course
 * Run with: node publish-test-course.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const Course = require('./src/models/Course');

async function publishCourse() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find the draft course
    const course = await Course.findOne({
      title: 'test',
      status: 'draft'
    });

    if (!course) {
      console.log('❌ Course not found');
      process.exit(1);
    }

    console.log(`\n📚 Found course: ${course.title}`);
    console.log(`   Current status: ${course.status}`);
    console.log(`   Organization: ${course.organization_id}`);

    // Publish the course
    course.status = 'published';
    await course.save();

    console.log(`\n✅ Course published successfully!`);
    console.log(`   New status: ${course.status}`);
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

publishCourse();
