
const mongoose = require('mongoose');

async function run() {
    try {
        const mongoUri = "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(mongoUri);

        const User = require('../src/models/User');
        const Organization = require('../src/models/Organization');

        const user = await User.findOne({ email: 'dushyant4665fixlsolution@gmail.com' }).populate('organization_id');

        // Simulate authMiddleware attaching modules
        user.modulesEnabled = user.organization_id.modulesEnabled;
        user.organizationType = user.organization_id.type;

        console.log('--- TEST: toPublicJSON() ---');
        const publicUser = user.toPublicJSON();
        console.log('modulesEnabled:', publicUser.modulesEnabled);
        console.log('organizationType:', publicUser.organizationType);

        console.log('\n--- TEST: res.json serialization ---');
        const json = JSON.parse(JSON.stringify(publicUser));
        console.log('JSON modulesEnabled:', json.modulesEnabled);
        console.log('JSON organizationType:', json.organizationType);

        if (json.modulesEnabled && json.modulesEnabled.length > 0) {
            console.log('\n✅ VERIFICATION SUCCESS: Modules are preserved in serialization!');
        } else {
            console.log('\n❌ VERIFICATION FAILED: Modules are missing!');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err);
        process.exit(1);
    }
}

run();
