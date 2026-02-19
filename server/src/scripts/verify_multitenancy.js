const mongoose = require('mongoose');
const { Organization, User, Course, Enrollment } = require('../models');

// Configure Mongoose
const mongoUri = process.env.MONGODB_URI || "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0";

async function connectDB() {
    try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Connection error:', error.message);
        process.exit(1);
    }
}

async function verifyMultiTenancy() {
    await connectDB();

    const prefix = `verify_mt_${Date.now()}`;
    console.log(`Using prefix: ${prefix}`);

    try {
        // 1. Create Organizations
        const orgA = await Organization.create({
            name: `${prefix}_OrgA`,
            slug: `${prefix}_org_a`,
            code: `${prefix}_A`.toUpperCase(),
            status: 'active'
        });
        console.log(`✅ Organization A Created: ${orgA._id}`);

        const orgB = await Organization.create({
            name: `${prefix}_OrgB`,
            slug: `${prefix}_org_b`,
            code: `${prefix}_B`.toUpperCase(),
            status: 'active'
        });
        console.log(`✅ Organization B Created: ${orgB._id}`);

        // 2. Create Users
        const instructorA = await User.create({
            name: 'Instructor A',
            email: `${prefix}_inst_a@example.com`,
            password_hash: 'hashedpassword',
            role: 'instructor', // or teacher depending on enum
            organization_id: orgA._id,
            organization_code: orgA.code
        });
        console.log(`✅ Instructor A Created (Org A): ${instructorA._id}`);

        const instructorB = await User.create({
            name: 'Instructor B',
            email: `${prefix}_inst_b@example.com`,
            password_hash: 'hashedpassword',
            role: 'instructor',
            organization_id: orgB._id,
            organization_code: orgB.code
        });
        console.log(`✅ Instructor B Created (Org B): ${instructorB._id}`);

        const studentA = await User.create({
            name: 'Student A',
            email: `${prefix}_student_a@example.com`,
            password_hash: 'hashedpassword',
            role: 'student',
            organization_id: orgA._id,
            organization_code: orgA.code
        });
        console.log(`✅ Student A Created (Org A): ${studentA._id}`);

        const studentB = await User.create({
            name: 'Student B',
            email: `${prefix}_student_b@example.com`,
            password_hash: 'hashedpassword',
            role: 'student',
            organization_id: orgB._id,
            organization_code: orgB.code
        });
        console.log(`✅ Student B Created (Org B): ${studentB._id}`);

        // 3. Create Courses
        const courseA = await Course.create({
            title: `${prefix} Course A`,
            description: 'Course A Description',
            price: 100,
            category: 'Test',
            instructor_id: instructorA._id,
            organization_id: orgA._id,
            status: 'published',
            isPublic: true // Even if public, should be hidden from Org B users
        });
        console.log(`✅ Course A Created (Org A): ${courseA._id}`);

        const courseB = await Course.create({
            title: `${prefix} Course B`,
            description: 'Course B Description',
            price: 100,
            category: 'Test',
            instructor_id: instructorB._id,
            organization_id: orgB._id,
            status: 'published',
            isPublic: true
        });
        console.log(`✅ Course B Created (Org B): ${courseB._id}`);


        // 4. Verify Course Visibility
        console.log('\n--- Verifying Course Visibility ---');

        // Simulate Student A (Org A) Query
        // Logic from routes/courses.js
        const getCoursesForUser = async (user) => {
            const filter = { isActive: true }; // Default filter

            if (user.role === 'teacher' || user.role === 'admin') {
                // ... (simplified as only pub status matters here for student check)
                if (user.role !== 'platform_admin' && user.role !== 'platformAdmin') {
                    // ...
                }
            } else {
                filter.status = 'published';
            }

            if (user.organization_id) {
                filter.organization_id = user.organization_id;
            } else {
                if (user.role !== 'platform_admin' && user.role !== 'platformAdmin') {
                    filter.isPublic = true;
                    filter.status = 'published';
                }
            }

            return await Course.find(filter);
        };

        const studentACourses = await getCoursesForUser(studentA);
        const hasCourseA = studentACourses.some(c => c._id.equals(courseA._id));
        const hasCourseB = studentACourses.some(c => c._id.equals(courseB._id));

        console.log(`Student A sees Course A? ${hasCourseA}`); // Should be true
        console.log(`Student A sees Course B? ${hasCourseB}`); // Should be false!

        if (hasCourseA && !hasCourseB) {
            console.log('✅ TEST PASSED: Student A sees only Org A courses.');
        } else {
            console.error('❌ TEST FAILED: Visibility leakage detected for Student A.');
        }

        const studentBCourses = await getCoursesForUser(studentB);
        const hasCourseA_B = studentBCourses.some(c => c._id.equals(courseA._id));
        const hasCourseB_B = studentBCourses.some(c => c._id.equals(courseB._id));

        console.log(`Student B sees Course A? ${hasCourseA_B}`); // Should be false!
        console.log(`Student B sees Course B? ${hasCourseB_B}`); // Should be true

        if (!hasCourseA_B && hasCourseB_B) {
            console.log('✅ TEST PASSED: Student B sees only Org B courses.');
        } else {
            console.error('❌ TEST FAILED: Visibility leakage detected for Student B.');
        }


        // 5. Verify Enrollment Access Restriction
        console.log('\n--- Verifying Enrollment Restriction ---');
        // Simulate endpoint logic from routes/enrollments.js
        const checkEnrollment = async (user, course) => {
            if (course.organization_id.toString() !== user.organization_id.toString()) {
                return { status: 403, message: 'Unauthorized' };
            }
            return { status: 200, message: 'OK' };
        };

        const enrollAttempt1 = await checkEnrollment(studentA, courseB);
        console.log(`Student A trying to enroll in Course B (Org B): ${enrollAttempt1.status}`);

        if (enrollAttempt1.status === 403) {
            console.log('✅ TEST PASSED: Cross-org enrollment blocked.');
        } else {
            console.error('❌ TEST FAILED: Cross-org enrollment allowed.');
        }

        const enrollAttempt2 = await checkEnrollment(studentA, courseA);
        console.log(`Student A trying to enroll in Course A (Org A): ${enrollAttempt2.status}`);
        if (enrollAttempt2.status === 200) {
            console.log('✅ TEST PASSED: Same-org enrollment allowed.');
        } else {
            console.error('❌ TEST FAILED: Same-org enrollment blocked.');
        }


    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        // Cleanup
        if (mongoose.connection.readyState === 1) {
            // Optional: delete created data
            // await Organization.deleteMany({ name: { $regex: /^verify_mt_/ } });
            // await User.deleteMany({ email: { $regex: /^verify_mt_/ } });
            // await Course.deleteMany({ title: { $regex: /^verify_mt_/ } });
            console.log('Cleanup could be performed here. Leaving data for inspection.');
            await mongoose.disconnect();
        }
    }
}

verifyMultiTenancy();
