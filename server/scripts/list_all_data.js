
const mongoose = require('mongoose');

async function run() {
    try {
        const mongoUri = "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(mongoUri);

        const Organization = require('../src/models/Organization');
        const User = require('../src/models/User');

        const allOrgs = await Organization.find();
        console.log(`📋 Total Organizations: ${allOrgs.length}`);
        allOrgs.forEach(o => {
            console.log(`- Name: "${o.name}" Type: ${o.type} Modules: ${o.modulesEnabled.length} Subdomain: ${o.subdomain}`);
        });

        const allAdmins = await User.find({ role: 'org_admin' }).populate('organization_id');
        console.log(`\n📋 Org Admins: ${allAdmins.length}`);
        allAdmins.forEach(u => {
            console.log(`- ${u.name} (${u.email}) Org: ${u.organization_id?.name || 'NONE'}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err);
        process.exit(1);
    }
}

run();
