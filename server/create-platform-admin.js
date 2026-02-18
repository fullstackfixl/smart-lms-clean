/**
 * Script to create a Platform Admin user
 * Platform admins have access to all organizations and system-wide settings
 * 
 * Usage: node create-platform-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'instructor', 'org_admin', 'platform_admin', 'parent', 'support_staff'],
    default: 'student' 
  },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  organization_code: { type: String },
  isActive: { type: Boolean, default: true },
  email_verified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Add index
userSchema.index({ email: 1, organization_id: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createPlatformAdmin() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get user input
    console.log('📝 Create Platform Admin User\n');
    console.log('Platform admins have full access to:');
    console.log('  - All organizations');
    console.log('  - System configuration');
    console.log('  - Subscription management');
    console.log('  - Revenue analytics');
    console.log('  - Global analytics\n');

    const name = await question('Enter name: ');
    const email = await question('Enter email: ');
    const password = await question('Enter password (min 6 characters): ');

    // Validate input
    if (!name || !email || !password) {
      console.error('❌ All fields are required!');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters!');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.error(`❌ User with email ${email} already exists!`);
      console.log(`   Current role: ${existingUser.role}`);
      
      const update = await question('\nDo you want to update this user to platform_admin? (yes/no): ');
      if (update.toLowerCase() === 'yes' || update.toLowerCase() === 'y') {
        existingUser.role = 'platform_admin';
        existingUser.organization_id = null; // Platform admins don't belong to any org
        existingUser.organization_code = null;
        existingUser.isActive = true;
        existingUser.email_verified = true;
        await existingUser.save();
        console.log('\n✅ User updated to platform_admin successfully!');
        console.log(`   Name: ${existingUser.name}`);
        console.log(`   Email: ${existingUser.email}`);
        console.log(`   Role: ${existingUser.role}`);
      } else {
        console.log('❌ Operation cancelled');
      }
      process.exit(0);
    }

    // Hash password
    console.log('\n🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create platform admin
    console.log('👤 Creating platform admin user...');
    const platformAdmin = new User({
      name,
      email: email.toLowerCase(),
      password_hash: hashedPassword, // Already hashed, so we need to skip the pre-save hook
      role: 'platform_admin',
      organization_id: null, // Platform admins don't belong to any organization
      organization_code: null,
      isActive: true,
      email_verified: true, // Auto-verify platform admins
    });

    // Skip the password hashing middleware since we already hashed it
    await platformAdmin.save({ validateBeforeSave: true });

    console.log('\n✅ Platform Admin created successfully!\n');
    console.log('📋 User Details:');
    console.log(`   ID: ${platformAdmin._id}`);
    console.log(`   Name: ${platformAdmin.name}`);
    console.log(`   Email: ${platformAdmin.email}`);
    console.log(`   Role: ${platformAdmin.role}`);
    console.log(`   Verified: ${platformAdmin.email_verified}`);
    console.log(`   Organization: None (Platform-wide access)`);
    console.log('\n🚀 You can now login with these credentials at /login');
    console.log(`   After login, you'll be redirected to: /platform`);
    console.log('\n📝 Login Credentials:');
    console.log(`   Email: ${platformAdmin.email}`);
    console.log(`   Password: [the password you entered]`);

  } catch (error) {
    console.error('\n❌ Error creating platform admin:', error.message);
    if (error.code === 11000) {
      console.error('   This email is already registered!');
    }
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
createPlatformAdmin();