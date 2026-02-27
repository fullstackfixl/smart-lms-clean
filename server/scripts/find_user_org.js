
const mongoose = require('mongoose');

async function run() {
    try {
        const mongoUri = "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(mongoUri);

        const User = require('../src/models/User');
        const Organization = require('../src/models/Organization');

        const user = await User.findOne({ email: /contact@school.com/i }).populate('organization_id');

        if (!user) {
            console.log('❌ User "contact@school.com" NOT FOUND.');
            const recentUsers = await User.find().sort({ created_at: -1 }).limit(10);
            console.log('Recent users:', recentUsers.map(u => `${u.email} (${u.role})`));
        } else {
            console.log('✅ User Found:');
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Org ID: ${user.organization_id?._id}`);

            if (user.organization_id) {
                const org = user.organization_id;
                console.log('✅ Organization Found (via User):');
                console.log(`   Name: ${org.name}`);
                console.log(`   Type: ${org.type}`);
                console.log(`   Modules: ${JSON.stringify(org.modulesEnabled)}`);
                console.log(`   Subdomain: ${org.subdomain}`);
            } else {
                console.log('❌ User has no organization_id linked.');
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err);
        process.exit(1);
    }
}

run();
