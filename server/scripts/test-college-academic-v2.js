const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const {
    Department,
    Program,
    Subject,
    StudentCourseEnrollment,
    StudentSubjectEnrollment,
    Organization,
    User,
} = require('../src/models');
const connectDB = require('../src/config/database');

async function verifyCollegeWorkflow() {
    try {
        console.log('--- Starting College Academic Workflow Verification (V2) ---');
        await connectDB();

        // 1. Setup/Find Organization
        let org = await Organization.findOne({ type: 'COLLEGE' });
        if (!org) {
            org = await Organization.create({
                name: 'Academic Excellence College',
                type: 'COLLEGE',
                subdomain: 'aec-' + Date.now(),
                code: 'AEC' + Math.floor(Math.random() * 1000),
                email: 'admin@aec.edu'
            });
            console.log('✅ Created new COLLEGE organization');
        }

        const orgId = org._id;

        // Cleanup previous test data to avoid duplicate keys
        await Subject.deleteMany({ organization_id: orgId, code: { $in: ['BCA101', 'BCA102'] } });
        await Program.deleteMany({ organization_id: orgId, code: 'BCA' });
        await Department.deleteMany({ organization_id: orgId, code: 'IT' });
        console.log('🧹 Cleaned up old test data');

        // 2. Setup Users
        const admin = await User.findOne({ role: 'org_admin', organization_id: orgId }) || await User.create({
            name: 'Org Admin',
            email: `admin-${Date.now()}@aec.edu`,
            role: 'org_admin',
            organization_id: orgId,
            isActive: true
        });

        const instructor = await User.create({
            name: 'Dr. Smith',
            email: `smith-${Date.now()}@aec.edu`,
            role: 'instructor',
            organization_id: orgId,
            isActive: true
        });

        const student = await User.create({
            name: 'Alice Student',
            email: `alice-${Date.now()}@aec.edu`,
            role: 'student',
            organization_id: orgId,
            isActive: true,
            profile: {}
        });
        console.log('✅ Users setup completed');

        // 3. Create Department and Program
        const dept = await Department.create({
            organization_id: orgId,
            name: 'Information Technology',
            code: 'IT',
            createdBy: admin._id
        });

        const program = await Program.create({
            organization_id: orgId,
            department_id: dept._id,
            name: 'Bachelor of Computer Applications',
            code: 'BCA',
            duration: '3 Years',
            createdBy: admin._id
        });
        console.log('✅ Department and Program created');

        // 4. Create Subjects for Semester 1
        const subject1 = await Subject.create({
            organization_id: orgId,
            department_id: dept._id,
            program_id: program._id,
            name: 'Programming in C',
            code: 'BCA101',
            semester: 1,
            instructor_id: instructor._id,
            createdBy: admin._id
        });

        const subject2 = await Subject.create({
            organization_id: orgId,
            department_id: dept._id,
            program_id: program._id,
            name: 'Mathematics I',
            code: 'BCA102',
            semester: 1,
            instructor_id: instructor._id,
            createdBy: admin._id
        });
        console.log('✅ Subjects created for Semester 1');

        // 5. Enroll Student in Program and Semester 1
        console.log('--- Testing Enrollment Execution ---');
        // This simulates the AcademicEnrollmentController.enrollInProgram logic
        student.profile.program_id = program._id;
        student.profile.current_semester = 1;
        student.profile.department = dept._id;
        await student.save();

        await StudentCourseEnrollment.create({
            organizationId: orgId,
            studentId: student._id,
            courseId: program._id,
            departmentId: dept._id,
            semester: 1
        });

        const subjects = await Subject.find({ program_id: program._id, semester: 1, organization_id: orgId });
        const subEnrollments = subjects.map(s => ({
            organizationId: orgId,
            studentId: student._id,
            subjectId: s._id,
            courseId: program._id,
            departmentId: dept._id,
            semester: 1
        }));
        await StudentSubjectEnrollment.insertMany(subEnrollments);
        console.log(`✅ Student enrolled in Program and ${subEnrollments.length} Subjects`);

        // 6. Verification Queries
        console.log('--- Verification Queries ---');

        // Find student subjects
        const studentSubjects = await Subject.find({
            program_id: student.profile.program_id,
            semester: student.profile.current_semester,
            organization_id: orgId
        });
        console.log(`✅ Verification: Student can access ${studentSubjects.length} subjects for Semester 1`);
        if (studentSubjects.length !== 2) throw new Error('Student subject count mismatch!');

        // Find instructor subjects
        const instructorSubjects = await Subject.find({
            instructor_id: instructor._id,
            organization_id: orgId
        });
        console.log(`✅ Verification: Instructor can access ${instructorSubjects.length} subjects`);
        if (instructorSubjects.length !== 2) throw new Error('Instructor subject count mismatch!');

        console.log('--- COMPLETE WORKFLOW VERIFICATION SUCCESSFUL ---');
    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        mongoose.connection.close();
    }
}

verifyCollegeWorkflow();
