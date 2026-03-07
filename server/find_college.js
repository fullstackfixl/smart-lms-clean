const mongoose = require('mongoose');
const Organization = require('./src/models/Organization');
require('dotenv').config({ path: './.env' });

async function findCollege() {
    await mongoose.connect(process.env.MONGODB_URI);
    const college = await Organization.findOne({ type: 'College' });
    if (college) {
        console.log('College found:');
        console.log('Name:', college.name);
        console.log('ID:', college._id);
        console.log('Type:', college.type);
    } else {
        const anyOrg = await Organization.findOne();
        if (anyOrg) {
            console.log('No College found, but found another org:');
            console.log('Name:', anyOrg.name);
            console.log('ID:', anyOrg._id);
            console.log('Type:', anyOrg.type);
        } else {
            console.log('No organizations found');
        }
    }
    await mongoose.disconnect();
}

findCollege();
