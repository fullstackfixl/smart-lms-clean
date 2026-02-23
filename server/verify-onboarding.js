const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const { Organization, User, OrganizationApplication, OrganizationApprovalToken } = require('./src/models');
const authService = require('./src/services/authService');
const platformApplicationController = require('./src/controllers/PlatformApplicationController');

async function verifyFlow() {
    try {
        console.log('🚀 Starting Verification Flow...');

        // Connect to DB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const testEmail = 'dushyant22062003@gmail.com';
        const testSubdomain = 'test-org-' + Date.now();

        // 1. Cleanup
        await OrganizationApplication.deleteMany({ admin_email: testEmail });
        await Organization.deleteMany({ subdomain: testSubdomain });
        await User.deleteMany({ email: testEmail });
        console.log('🧹 Cleanup complete');

        // 2. Submit Application
        console.log('\n📝 1. Submitting Application...');
        const appData = {
            organizationName: 'Test Organization',
            subdomain: testSubdomain,
            adminName: 'Dushyant',
            adminEmail: testEmail,
            selectedPlan: 'pro'
        };
        const application = await authService.applyOrganization(appData);
        console.log('✅ Application submitted:', application._id);

        // 3. Approve Application (Simulating Request)
        console.log('\n⚖️ 2. Approving Application...');
        const req = { params: { id: application._id } };
        const res = {
            success: (data) => data,
            error: (msg) => { throw new Error(msg); }
        };

        const approvalResult = await platformApplicationController.approveApplication(req, res);
        const token = approvalResult.token;
        console.log('✅ Application approved');
        console.log('🎫 Approval Token:', token);
        console.log('🔗 Setup Link:', approvalResult.setupLink);

        // 4. Complete Registration (Set Password)
        console.log('\n🔒 3. Completing Registration...');
        const completionData = {
            token,
            password: 'StrongPassword123!'
        };
        const finalResult = await authService.completeOrganizationRegistration(completionData);
        console.log('✅ Registration completed');
        console.log('🔑 Generated JWT Token:', finalResult.token.substring(0, 20) + '...');

        // 5. Verify Database Records
        console.log('\n🔍 4. Verifying Database Records...');
        const org = await Organization.findOne({ subdomain: testSubdomain });
        const user = await User.findOne({ email: testEmail });

        if (org && user && org.admin_user_id.equals(user._id) && user.organization_id.equals(org._id)) {
            console.log('✨ SUCCESS: Organization and User created and linked correctly!');
            console.log('🏫 Organization:', org.name, `(${org.plan})`);
            console.log('👤 Admin User:', user.name, `(${user.role})`);
        } else {
            throw new Error('Verification failed: Database records mismatch');
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Verification failed:', error.message);
        process.exit(1);
    }
}

verifyFlow();
