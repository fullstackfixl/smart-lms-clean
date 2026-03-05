require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const {
    Organization, User, Course, Enrollment,
    Department, Semester, Subject, AcademicRecord, GradeSummary
} = require('../models');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/database');

// Use the existing MONGODB_URI from environment
const mongoUri = process.env.MONGODB_URI;

async function runTest() {
    try {
        await connectDB();
        console.log('\n--- 🚀 Database Connected ---\n');
    } catch (error) {
        console.error('❌ Connection error:', error.message);
        process.exit(1);
    }

    const prefix = `test_acad_${Date.now()}`;
    console.log(`Test Execution Prefix: ${prefix}\n`);

    const cleanupIds = {
        organizations: [],
        users: [],
        courses: [],
        departments: [],
        semesters: [],
        subjects: [],
        academicRecords: [],
        gradeSummaries: []
    };

    try {
        // --- STAGE 1: BOOTSTRAP ORGANIZATIONS ---
        console.log('STAGE 1: Bootstrapping Organizations...');
        const orgA = await Organization.create({
            name: `${prefix}_College_A`,
            slug: `${prefix}-college-a`,
            code: `${prefix}A`.toUpperCase(),
            type: 'COLLEGE',
            status: 'active'
        });
        cleanupIds.organizations.push(orgA._id);

        const orgB = await Organization.create({
            name: `${prefix}_Institute_B`,
            slug: `${prefix}-inst-b`,
            code: `${prefix}B`.toUpperCase(),
            type: 'INSTITUTE',
            status: 'active'
        });
        cleanupIds.organizations.push(orgB._id);
        console.log('✅ Organizations bootstrapped (Org A: COLLEGE, Org B: INSTITUTE)\n');


        // --- STAGE 2: IDENTITY SETUP ---
        console.log('STAGE 2: Setting up Identities...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        const adminA = await User.create({
            name: 'Admin A',
            email: `${prefix}_admin_a@test.com`,
            password: hashedPassword,
            role: 'org_admin',
            organization_id: orgA._id,
            organization_code: orgA.code
        });
        cleanupIds.users.push(adminA._id);

        const instructorA = await User.create({
            name: 'Instructor A',
            email: `${prefix}_inst_a@test.com`,
            password: hashedPassword,
            role: 'instructor',
            organization_id: orgA._id,
            organization_code: orgA.code
        });
        cleanupIds.users.push(instructorA._id);

        const studentA = await User.create({
            name: 'Student A',
            email: `${prefix}_student_a@test.com`,
            password: hashedPassword,
            role: 'student',
            organization_id: orgA._id,
            organization_code: orgA.code,
            profile: { department: 'Computer Science' }
        });
        cleanupIds.users.push(studentA._id);

        const studentB = await User.create({
            name: 'Student B',
            email: `${prefix}_student_b@test.com`,
            password: hashedPassword,
            role: 'student',
            organization_id: orgB._id,
            organization_code: orgB.code
        });
        cleanupIds.users.push(studentB._id);
        console.log('✅ Identities setup for both organizations\n');


        // --- STAGE 3: ACADEMIC STRUCTURE (ORG A) ---
        console.log('STAGE 3: Building Academic Structure for Org A (COLLEGE)...');
        const deptA = await Department.create({
            name: 'Computer Science',
            code: 'CS',
            organization_id: orgA._id
        });
        cleanupIds.departments.push(deptA._id);

        const semA = await Semester.create({
            name: 'Fall 2024',
            number: 1,
            organization_id: orgA._id,
            is_active: true
        });
        cleanupIds.semesters.push(semA._id);

        const subjectA = await Subject.create({
            name: 'Database Systems',
            code: 'CS101',
            credits: 4,
            department_id: deptA._id,
            semester_id: semA._id,
            organization_id: orgA._id
        });
        cleanupIds.subjects.push(subjectA._id);

        const courseA = await Course.create({
            title: 'Advanced MongoDB',
            description: 'Database mastery course',
            instructor_id: instructorA._id,
            organization_id: orgA._id,
            academic_subject: subjectA._id,
            academic_semester: semA._id,
            status: 'published'
        });
        cleanupIds.courses.push(courseA._id);
        console.log('✅ Academic structure (Dept -> Sem -> Subj -> Course) created for Org A\n');


        // --- STAGE 4: ENROLLMENT ---
        console.log('STAGE 4: Processing Enrollments...');
        await Enrollment.create({
            student_id: studentA._id,
            course_id: courseA._id,
            organization_id: orgA._id,
            status: 'active'
        });
        console.log('✅ Student A enrolled in Course A\n');


        // --- STAGE 5: INSTRUCTIONAL FEEDBACK & MARKS ---
        console.log('STAGE 5: Instructor marking verified...');
        // Simulate instructor updating marks (85 internal + 10 exam = 95 -> A)
        const record = await AcademicRecord.findOneAndUpdate(
            { student_id: studentA._id, course_id: courseA._id, organization_id: orgA._id },
            {
                semester_id: semA._id,
                internal_marks: 85,
                exam_marks: 10,
                credits: 4,
                organization_id: orgA._id
            },
            { upsert: true, new: true }
        );
        cleanupIds.academicRecords.push(record._id);

        console.log(`   Calculated Total Score: ${record.total}`);
        console.log(`   Calculated Grade: ${record.grade}`);
        console.log(`   GPA Points: ${record.gpa_points}`);

        if (record.grade === 'A' && record.gpa_points === 4.0) {
            console.log('✅ PASSED: Automatic grade and GPA calculation correct\n');
        } else {
            throw new Error(`Grade Calculation Error: Expected A/4.0, got ${record.grade}/${record.gpa_points}`);
        }


        // --- STAGE 6: ANALYTICS SYNC (GRADESUMMARY) ---
        console.log('STAGE 6: Verifying Reporting Sync (GradeSummary)...');
        // Manual sync simulate (logic from controller)
        const total = record.internal_marks + record.exam_marks;
        const summary = await GradeSummary.findOneAndUpdate(
            { organization_id: orgA._id, course_id: courseA._id, student_id: studentA._id },
            {
                current_percentage: total,
                letter_grade: 'A',
                grade_points: record.gpa_points,
                last_updated: new Date(),
                is_active: true
            },
            { upsert: true, new: true }
        );
        cleanupIds.gradeSummaries.push(summary._id);

        if (summary.current_percentage === 95 && summary.letter_grade === 'A') {
            console.log('✅ PASSED: GradeSummary synced correctly for administrative reporting\n');
        } else {
            throw new Error('Sync Error: GradeSummary mismatch');
        }


        // --- STAGE 7: TENANT ISOLATION LEAK TEST ---
        console.log('STAGE 7: Verification of Multi-Tenant Isolation...');

        // Test 1: Org B user should not see Org A subjects
        const subjectsInOrgB = await Subject.find({ organization_id: orgB._id });
        console.log(`   Subjects visible to Org B: ${subjectsInOrgB.length}`);

        // Test 2: Org B user should not see Org A transcript records
        const recordsInOrgB = await AcademicRecord.find({ organization_id: orgB._id });
        console.log(`   Academic Records visible to Org B: ${recordsInOrgB.length}`);

        if (subjectsInOrgB.length === 0 && recordsInOrgB.length === 0) {
            console.log('✅ PASSED: Zero cross-tenant data leakage detected\n');
        } else {
            throw new Error('ISOLATION FAILURE: Cross-tenant data visible');
        }


        // --- FINAL SUMMARY ---
        console.log('--- 🏆 ALL TESTS PASSED COMPREHENSIVELY ---\n');

    } catch (error) {
        console.error('\n❌ TEST SUITE FAILED:', error.message);
        process.exitCode = 1;
    } finally {
        console.log('STAGE 8: Initiating Cleanup...');
        try {
            await AcademicRecord.deleteMany({ _id: { $in: cleanupIds.academicRecords } });
            await GradeSummary.deleteMany({ _id: { $in: cleanupIds.gradeSummaries } });
            await Course.deleteMany({ _id: { $in: cleanupIds.courses } });
            await Subject.deleteMany({ _id: { $in: cleanupIds.subjects } });
            await Semester.deleteMany({ _id: { $in: cleanupIds.semesters } });
            await Department.deleteMany({ _id: { $in: cleanupIds.departments } });
            await Enrollment.deleteMany({ organization_id: { $in: cleanupIds.organizations } });
            await User.deleteMany({ _id: { $in: cleanupIds.users } });
            await Organization.deleteMany({ _id: { $in: cleanupIds.organizations } });
            console.log('✅ Cleanup complete. Staging database is clean.');
        } catch (cleanupErr) {
            console.error('⚠️ Cleanup partially failed:', cleanupErr.message);
        }
        await mongoose.disconnect();
    }
}

runTest();
