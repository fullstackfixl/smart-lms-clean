
const mongoose = require('mongoose');

async function run() {
    try {
        const mongoUri = "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const PlatformApplicationController = require('../src/controllers/PlatformApplicationController');
        const OrganizationApplication = require('../src/models/OrganizationApplication');

        const id = '69a1248724d0671d986d5250';

        // Ensure it's pending first
        await OrganizationApplication.findByIdAndUpdate(id, { status: 'pending', organization_type: undefined });
        console.log('✅ Reset status to pending');

        // Mock req/res
        const req = {
            params: { id }
        };
        const res = {
            success: (data, msg) => {
                console.log('✅ SUCCESS:', msg);
                console.log('   Data:', JSON.stringify(data, null, 2));
                process.exit(0);
            },
            error: (msg, type, code) => {
                console.log('❌ ERROR:', msg);
                console.log('   Type:', type);
                console.log('   Code:', code);
                process.exit(1);
            }
        };

        console.log('🚀 Calling approveApplication...');
        await PlatformApplicationController.approveApplication(req, res);

    } catch (err) {
        console.error('❌ Crash:', err);
        process.exit(1);
    }
}

run();
