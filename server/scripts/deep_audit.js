
const mongoose = require('mongoose');

async function run() {
    try {
        const mongoUri = "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(mongoUri);

        const OrganizationApplication = require('../src/models/OrganizationApplication');
        const Organization = require('../src/models/Organization');
        const User = require('../src/models/User');

        const app = await OrganizationApplication.findById('69a1248724d0671d986d5250');
        console.log('--- APPLICATION ---');
        if (app) {
            console.log(`ID: ${app._id}`);
            console.log(`Status: ${app.status}`);
            console.log(`Type: ${app.organization_type}`);
            console.log(`Modules: ${JSON.stringify(app.modulesEnabled)}`);
            console.log(`Admin Email: ${app.admin_email}`);
        } else {
            console.log('❌ App not found');
        }

        const user = await User.findOne({ email: 'dushyant4665fixlsolution@gmail.com' }).populate('organization_id');
        console.log('\n--- USER & ORG ---');
        if (user) {
            console.log(`User: ${user.name} (${user.email})`);
            console.log(`Org ID: ${user.organization_id?._id}`);
            if (user.organization_id) {
                const org = user.organization_id;
                console.log(`Org Name: ${org.name}`);
                console.log(`Org Type: ${org.type}`);
                console.log(`Org Modules: ${JSON.stringify(org.modulesEnabled)}`);
            }
        } else {
            console.log('❌ User not found');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err);
        process.exit(1);
    }
}

run();
