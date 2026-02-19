/**
 * Fix Orphaned Enrollments
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixOrphanedEnrollments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Load models
    const Enrollment = require('./src/models/Enrollment');
    
    // Find ALL enrollments with null course_id
    const orphaned = await Enrollment.find({ course_id: null }).lean();
    
    console.log(`\n📊 Found ${orphaned.length} orphaned enrollments`);
    
    if (orphaned.length > 0) {
      orphaned.forEach((e, i) => {
        console.log(`\n${i + 1}. Enrollment ID: ${e._id}`);
        console.log(`   Student ID: ${e.student_id}`);
        console.log(`   Course ID: ${e.course_id}`);
        console.log(`   Status: ${e.status}`);
      });
      
      console.log('\n🗑️  Deleting orphaned enrollments...');
      const result = await Enrollment.deleteMany({ course_id: null });
      console.log(`✅ Deleted ${result.deletedCount} orphaned enrollments`);
    } else {
      console.log('✅ No orphaned enrollments found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixOrphanedEnrollments();
