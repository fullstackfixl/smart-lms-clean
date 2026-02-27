
const mongoose = require('mongoose');

async function run() {
    try {
        const mongoUri = "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(mongoUri);

        const Organization = require('../src/models/Organization');
        const org = await Organization.findOne({ name: /My School/i });

        if (!org) {
            console.log('❌ Organization "My School" NOT FOUND.');
            const allOrgs = await Organization.find().limit(5);
            console.log('Recent orgs:', allOrgs.map(o => o.name));
        } else {
            console.log('✅ Organization Found:');
            console.log(`   ID: ${org._id}`);
            console.log(`   Name: ${org.name}`);
            console.log(`   Type: ${org.type}`);
            console.log(`   Modules: ${JSON.stringify(org.modulesEnabled)}`);
            console.log(`   Status: ${org.status}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err);
        process.exit(1);
    }
}

run();
