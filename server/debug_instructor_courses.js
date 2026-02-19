const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();
const { Course, User } = require('./src/models');

const mongoUri = process.env.MONGODB_URI || "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0";

async function debugCourses() {
    const output = [];
    const log = (msg) => {
        console.log(msg);
        output.push(msg);
    };

    try {
        log('Connecting to: ' + mongoUri.split('@')[1]);
        await mongoose.connect(mongoUri);
        log('✅ Connected to MongoDB');

        const email = 'dushyant22062003@gmail.com';
        const instructor = await User.findOne({ email });

        if (!instructor) {
            log('Instructor not found');
        } else {
            log('Instructor found: ' + instructor._id);
            log('Org: ' + instructor.organization_id);

            // 1. Check all courses by this instructor (ignoring org)
            const allCourses = await Course.find({ instructor_id: instructor._id });
            log(`Found ${allCourses.length} courses for instructor (ignoring org filter).`);

            if (allCourses.length === 0) {
                log('No courses found for this instructor.');
            } else {
                allCourses.forEach(c => {
                    log(`- [${c._id}] "${c.title}"`);
                    log(`  Org: ${c.organization_id}`);
                    log(`  Deleted: ${c.is_deleted}`);
                    log(`  Match Org: ${c.organization_id?.toString() === instructor.organization_id?.toString()}`);
                });
            }
        }

        await mongoose.disconnect();
        fs.writeFileSync('debug_output.txt', output.join('\n'));
        console.log('Output written to debug_output.txt');
    } catch (error) {
        console.error(error);
        fs.writeFileSync('debug_output.txt', 'Error: ' + error.message);
    }
}

debugCourses();
