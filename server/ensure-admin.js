const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const { User } = require('./src/models');

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const email = 'platformadmin@smartlms.com';
        const password = 'AdminPassword123!';
        const hashedPassword = await bcrypt.hash(password, 10);

        let admin = await User.findOne({ email });
        if (admin) {
            admin.password_hash = hashedPassword;
            admin.role = 'platform_admin';
            admin.status = 'active';
            await admin.save();
            console.log('✅ Updated existing Platform Admin');
        } else {
            admin = await User.create({
                name: 'Platform Administrator',
                email,
                password_hash: hashedPassword,
                role: 'platform_admin',
                status: 'active',
                email_verified: true
            });
            console.log('✅ Created new Platform Admin');
        }

        console.log('\n--- ADMIN CREDENTIALS ---');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('-------------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createAdmin();
