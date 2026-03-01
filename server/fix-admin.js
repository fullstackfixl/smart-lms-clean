require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fixAdmin() {
    const uri = process.env.MONGODB_URI || "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0";
    console.log('Connecting to DB...');
    await mongoose.connect(uri, { family: 4, serverSelectionTimeoutMS: 20000 });
    console.log('Connected!');

    const User = require('./src/models/User');

    // Find user
    const email = 'platform@admin.com';
    const newPassword = '121321421';

    let user = await User.findOne({ email }).select('+password_hash');

    if (!user) {
        console.log('❌ User not found! Creating platform admin...');
        const hash = await bcrypt.hash(newPassword, 10);
        user = await User.create({
            email,
            name: 'Platform Admin',
            role: 'platform_admin',
            password_hash: hash,
            email_verified: true,
            status: 'active'
        });
        console.log('✅ Platform admin created!');
    } else {
        console.log('✅ User found:', user.email, '| role:', user.role, '| status:', user.status, '| email_verified:', user.email_verified);

        // Fix email_verified and status
        const hash = await bcrypt.hash(newPassword, 10);
        await User.updateOne({ email }, {
            $set: {
                email_verified: true,
                status: 'active',
                password_hash: hash
            }
        });
        console.log('✅ Fixed! email_verified=true, status=active, password reset to:', newPassword);

        // Verify fix
        const updated = await User.findOne({ email }).select('+password_hash');
        const isMatch = await bcrypt.compare(newPassword, updated.password_hash);
        console.log('✅ Password verification test:', isMatch ? 'PASS' : 'FAIL');
    }

    await mongoose.disconnect();
    console.log('Done.');
}

fixAdmin().catch(e => { console.error(e); process.exit(1); });
