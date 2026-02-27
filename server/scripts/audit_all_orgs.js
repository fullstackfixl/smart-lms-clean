
const mongoose = require('mongoose');

async function run() {
    try {
        const mongoUri = "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(mongoUri);

        const Organization = require('../src/models/Organization');

        const orgs = await Organization.find();
        console.log(`📋 Total Organizations: ${orgs.length}\n`);

        orgs.forEach(o => {
            console.log(`- Org: "${o.name}" (ID: ${o._id})`);
            console.log(`  Type: ${o.type}`);
            console.log(`  Modules: ${JSON.stringify(o.modulesEnabled)}`);
            console.log(`  Plan: ${o.plan}`);
            console.log('---');
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err);
        process.exit(1);
    }
}

run();
