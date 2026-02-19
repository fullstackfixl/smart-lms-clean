/**
 * Create a test student account for testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const TEST_STUDENT = {
  name: 'Test Student',
  email: 'student@test.com',
  password: 'TestPass123!',
  role: 'student',
  organization_id: null // Will be set from existing org
};

async function createTestStudent() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find an existing organization
    const existingUser = await User.findOne({ role: { $in: ['instructor', 'org_admin'] } });
    if (!existingUser || !existingUser.organization_id) {
      console.log('❌ No organization found. Please create an organization first.');
      process.exit(1);
    }

    TEST_STUDENT.organization_id = existingUser.organization_id;
    console.log('📍 Using organization:', existingUser.organization_id);

    // Check if student already exists
    const existingStudent = await User.findOne({ email: TEST_STUDENT.email });
    if (existingStudent) {
      console.log('✅ Test student already exists');
      console.log('   Email:', TEST_STUDENT.email);
      console.log('   Password:', TEST_STUDENT.password);
      console.log('   Organization:', existingStudent.organization_id);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(TEST_STUDENT.password, 10);

    // Create student
    const student = new User({
      name: TEST_STUDENT.name,
      email: TEST_STUDENT.email,
      password_hash: hashedPassword,
      role: TEST_STUDENT.role,
      organization_id: TEST_STUDENT.organization_id,
      isVerified: true,
      isActive: true
    });

    await student.save();

    console.log('✅ Test student created successfully!');
    console.log('   Email:', TEST_STUDENT.email);
    console.log('   Password:', TEST_STUDENT.password);
    console.log('   Organization:', TEST_STUDENT.organization_id);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestStudent();
