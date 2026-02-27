
const mongoose = require('mongoose');

async function run() {
    try {
        const mongoUri = "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(mongoUri);

        const OrganizationApplication = require('../src/models/OrganizationApplication');
        const apps = await OrganizationApplication.find({ status: 'pending' });

        console.log(`📋 Found ${apps.length} pending applications:`);
        apps.forEach(app => {
            console.log(`- ID: ${app._id} Name: ${app.organization_name} Type: ${app.organization_type || 'MISSING'}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err);
        process.exit(1);
    }
}

run();
