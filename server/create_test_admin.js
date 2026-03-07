const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' }); // Corrected path

async function createTestAdmin() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('❌ MONGODB_URI not found in .env');
            process.exit(1);
        }
        console.log('Connecting to database...');
        await mongoose.connect(uri);

        // Register all needed schemas
        require('./src/models/User');
        require('./src/models/Organization');
        require('./src/models/Department');
        require('./src/models/Program');
        require('./src/models/Subject');

        const User = mongoose.model('User');
        const Organization = mongoose.model('Organization');
        const Department = mongoose.model('Department');

        // 1. Find or create organization
        let org = await Organization.findOne({ subdomain: 'college' });
        if (!org) {
            org = new Organization({
                name: 'College Organization',
                subdomain: 'college',
                email: 'org@college.com',
                type: 'COLLEGE',
                status: 'active',
                modulesEnabled: ['DEPARTMENTS', 'SEMESTERS', 'SUBJECTS', 'BATCHES', 'ACADEMIC_YEAR']
            });
            await org.save();
            console.log('✅ Organization created');
        } else {
            org.type = 'COLLEGE';
            org.modulesEnabled = ['DEPARTMENTS', 'SEMESTERS', 'SUBJECTS', 'BATCHES', 'ACADEMIC_YEAR'];
            await org.save();
            console.log('✅ Organization updated');
        }

        // 2. Setup Department
        let dept = await Department.findOne({ organization_id: org._id });
        if (!dept) {
            dept = new Department({
                name: 'Computer Science',
                code: 'CS',
                organization_id: org._id,
                isActive: true
            });
            await dept.save();
            console.log('✅ Department created');
        }

        // 3. Create Admin
        const email = 'testadmin@college.com';
        const password = 'Password123';
        const passwordHash = await bcrypt.hash(password, 10);

        await User.deleteOne({ email }); // Clear existing

        const admin = new User({
            name: 'Test Admin',
            email: email,
            password_hash: passwordHash,
            role: 'org_admin',
            organization_id: org._id,
            status: 'active',
            email_verified: true,
            profile: { fullName: 'Test Admin' }
        });

        await admin.save();
        console.log('✅ Test Admin created successfully!');
        console.log('Email:', email);
        console.log('Password:', password);

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

createTestAdmin();
