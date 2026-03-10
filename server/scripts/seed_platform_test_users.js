require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../src/models');

async function seedTestUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const password = 'Password123';
    const passwordHash = await bcrypt.hash(password, 10);

    const testUsers = [
      {
        name: 'Test Platform Admin',
        email: 'platform_admin@test.com',
        password_hash: passwordHash,
        role: 'platform_admin',
        isActive: true,
        status: 'active',
        email_verified: true
      },
      {
        name: 'Test Platform Staff',
        email: 'platform_staff@test.com',
        password_hash: passwordHash,
        role: 'platform_staff',
        isActive: true,
        status: 'active',
        email_verified: true
      },
      {
        name: 'Test Org Admin',
        email: 'org_admin@test.com',
        password_hash: passwordHash,
        role: 'org_admin',
        isActive: true,
        status: 'active',
        email_verified: true,
        organization_id: new mongoose.Types.ObjectId() // Dummy ID
      }
    ];

    for (const userData of testUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        // Use findOneAndUpdate to bypass some validation if needed, or just update
        await User.updateOne({ _id: existing._id }, { $set: userData });
        console.log(`Updated: ${userData.email}`);
      } else {
        await User.create(userData);
        console.log(`Created: ${userData.email}`);
      }
    }

    console.log('✅ Seeding complete');
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedTestUsers();
