const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });

// Requiring app.js will register all models
console.log('Registering models...');
require('./src/app');
console.log('Models after registration:', Object.keys(mongoose.models));

const Organization = mongoose.model('Organization');
const User = mongoose.model('User');
const Department = mongoose.model('Department');

async function setupTestData() {
    try {
        if (mongoose.connection.readyState === 0) {
            console.log('Connecting to DB...');
            await mongoose.connect(process.env.MONGODB_URI);
        }

        console.log('DB Connection State:', mongoose.connection.readyState);

        // 1. Find and Update NIMS to COLLEGE
        console.log('Searching for Organization...');
        let college = await Organization.findOne({ name: 'NIMS' });
        if (!college) {
            college = await Organization.findOne();
        }

        if (!college) {
            console.log('Creating new Organization...');
            college = new Organization({
                name: 'Test College',
                subdomain: 'testcollege',
                type: 'COLLEGE',
                email: 'info@testcollege.com',
                status: 'active',
                modulesEnabled: ['DEPARTMENTS', 'SEMESTERS', 'SUBJECTS', 'BATCHES', 'ACADEMIC_YEAR']
            });
        } else {
            console.log('Updating existing Organization:', college.name);
            college.type = 'COLLEGE';
            college.status = 'active';
            if (!college.email) college.email = 'info@nims.com';
            college.modulesEnabled = ['DEPARTMENTS', 'SEMESTERS', 'SUBJECTS', 'BATCHES', 'ACADEMIC_YEAR'];
        }

        await college.save();
        console.log('Updated/Created Org:', college.name, college._id);

        // 2. Setup Department
        console.log('Setting up Department...');
        let dept = await Department.findOne({ organization_id: college._id });
        if (!dept) {
            dept = new Department({
                name: 'Computer Science',
                code: 'CS',
                organization_id: college._id,
                isActive: true
            });
            await dept.save();
            console.log('Created Department:', dept._id);
        } else {
            console.log('Found Existing Department:', dept._id);
        }

        // 3. Setup Admin User
        console.log('Setting up Admin User...');
        let admin = await User.findOne({ email: 'testadmin@college.com' });
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash('Password123', salt);

        if (!admin) {
            admin = new User({
                email: 'testadmin@college.com',
                password_hash,
                role: 'org_admin',
                status: 'active',
                email_verified: true,
                organization_id: college._id,
                profile: { fullName: 'Test Org Admin' }
            });
            await admin.save();
            console.log('Created Admin User');
        } else {
            admin.password_hash = password_hash;
            admin.status = 'active';
            admin.email_verified = true;
            admin.organization_id = college._id;
            await admin.save();
            console.log('Updated Existing Admin User');
        }

        console.log('✅ Setup Completed Successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Setup Error:', error);
        process.exit(1);
    }
}

setupTestData();
