
const mongoose = require('mongoose');

async function run() {
    try {
        const mongoUri = "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(mongoUri);

        const User = require('../src/models/User');
        const Organization = require('../src/models/Organization');

        const user = await User.findOne({ email: 'dushyant4665fixlsolution@gmail.com' }).populate('organization_id');

        // Simulate middleware attaching modules
        user.modulesEnabled = user.organization_id.modulesEnabled;

        console.log('--- RAW USER OBJECT ---');
        console.log('modulesEnabled:', user.modulesEnabled);

        console.log('\n--- SIMULATED res.json({ user }) ---');
        const responseData = JSON.parse(JSON.stringify({ user }));
        console.log('Found modulesEnabled in JSON?:', !!responseData.user.modulesEnabled);
        console.log('JSON content:', JSON.stringify(responseData.user, null, 2).substring(0, 500) + '...');

        console.log('\n--- CORRECT toPublicJSON() ---');
        const publicUser = user.toPublicJSON();
        console.log('Found modulesEnabled in Public JSON?:', !!publicUser.modulesEnabled);
        console.log('Public JSON content:', JSON.stringify(publicUser, null, 2).substring(0, 500) + '...');

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err);
        process.exit(1);
    }
}

run();
