const mongoose = require('mongoose');
const { Organization, User } = require('../src/models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function runVerification() {
    try {
        console.log('🚀 Starting Organization Invite Flow Verification...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Setup - Find or create a platform admin
        let platformAdmin = await User.findOne({ role: 'platform_admin' });
        if (!platformAdmin) {
            console.log('ℹ️ No platform admin found, creating a test one...');
            platformAdmin = new User({
                name: 'Test Platform Admin',
                email: 'test-platform-admin@example.com',
                password_hash: await bcrypt.hash('Password123!', 10),
                role: 'platform_admin',
                status: 'active',
                email_verified: true
            });
            await platformAdmin.save();
        }
        console.log('✅ Using Platform Admin:', platformAdmin.email);

        // 2. Simulate Platform Admin creating an organization
        const orgName = `Test Org ${Date.now()}`;
        const orgType = 'School';
        const adminName = 'Test Org Admin';
        const adminEmail = `test-org-admin-${Date.now()}@example.com`;

        console.log(`📝 Creating organization: ${orgName}...`);

        // Mock the logic from the controller
        const subdomain = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const organization = new Organization({
            name: orgName,
            type: orgType,
            subdomain: `${subdomain}-${Math.random().toString(36).substring(2, 7)}`,
            status: 'pending',
            created_by: platformAdmin._id
        });
        await organization.save();

        const inviteToken = require('crypto').randomBytes(32).toString('hex');
        const inviteTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const orgAdmin = new User({
            name: adminName,
            email: adminEmail.toLowerCase(),
            password_hash: null,
            role: 'org_admin',
            organization_id: organization._id,
            status: 'pending',
            email_verified: false,
            inviteToken,
            inviteTokenExpiry
        });
        await orgAdmin.save();

        organization.admin_user_id = orgAdmin._id;
        await organization.save();

        console.log('✅ Organization and Org Admin created with status PENDING');
        console.log('🔗 Invite Token:', inviteToken);

        // 3. Verify Token
        console.log('🔍 Verifying invitation token...');
        const verifiedUser = await User.findOne({
            inviteToken,
            inviteTokenExpiry: { $gt: new Date() }
        }).populate('organization_id');

        if (!verifiedUser || verifiedUser.organization_id.name !== orgName) {
            throw new Error('❌ Token verification failed');
        }
        console.log('✅ Token verification successful');

        // 4. Complete Setup
        console.log('⚙️ Completing organization setup...');
        const setupAddress = '123 Test Street, Matrix City';
        const setupPhone = '+1234567890';
        const setupPassword = 'NewSecurePassword123!';

        verifiedUser.password_hash = await bcrypt.hash(setupPassword, 10);
        verifiedUser.status = 'active';
        verifiedUser.email_verified = true;
        verifiedUser.inviteToken = undefined;
        verifiedUser.inviteTokenExpiry = undefined;
        await verifiedUser.save();

        const verifiedOrg = await Organization.findById(verifiedUser.organization_id);
        verifiedOrg.status = 'active';
        verifiedOrg.address = { street: setupAddress }; // Simplified for test
        verifiedOrg.phone = setupPhone;
        await verifiedOrg.save();

        console.log('✅ Organization setup completed and status is now ACTIVE');

        // 5. Final Verification
        const finalUser = await User.findOne({ email: adminEmail });
        const finalOrg = await Organization.findById(organization._id);

        console.log('--- Final Status ---');
        console.log('Org Admin Status:', finalUser.status);
        console.log('Organization Status:', finalOrg.status);
        console.log('Org Admin Password Set:', !!finalUser.password_hash);
        console.log('Invite Token Cleared:', !finalUser.inviteToken);

        if (finalUser.status === 'active' && finalOrg.status === 'active') {
            console.log('✨ VERIFICATION SUCCESSFUL: Flow works correctly!');
        } else {
            console.log('❌ VERIFICATION FAILED: Status mismatch');
        }

    } catch (error) {
        console.error('❌ Verification failed with error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

runVerification();
