const mongoose = require('mongoose');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization'); // Added this
require('dotenv').config({ path: './.env' });

async function checkUser() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: 'testadmin@college.com' }).populate('organization_id');
    if (user) {
        console.log('User found:');
        console.log('Email:', user.email);
        console.log('Role:', user.role);
        console.log('Status:', user.status);
        console.log('Email Verified:', user.email_verified);
        console.log('Organization:', user.organization_id?.name || 'None');
        console.log('Organization ID:', user.organization_id?._id || 'None');
    } else {
        console.log('User not found');
    }
    await mongoose.disconnect();
}

checkUser();
