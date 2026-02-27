
const mongoose = require('mongoose');

async function run() {
    try {
        const mongoUri = "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0";
        console.log('🔌 Connecting to MongoDB Atlas...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const OrganizationApplication = require('../src/models/OrganizationApplication');
        const id = '69a1248724d0671d986d5250';

        const app = await OrganizationApplication.findById(id);
        if (!app) {
            console.log(`❌ Application ${id} NOT FOUND.`);
        } else {
            console.log('✅ Current Status:', app.status);
            app.status = 'pending';
            app.organization_type = undefined; // Force it to test my legacy fallback
            await app.save();
            console.log('✅ Status RESET to pending and type removed for re-testing.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Diagnostic failed:', err);
        process.exit(1);
    }
}

run();
