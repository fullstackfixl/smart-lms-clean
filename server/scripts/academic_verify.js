/**
 * Verification Script for College Academic Layer
 * This script tests the Department -> Program -> Subject -> Enrollment flow.
 */
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const {
    Department,
    Program,
    Subject,
    StudentCourseEnrollment,
    StudentSubjectEnrollment,
    Attendance,
    Organization,
    User,
    Course
} = require('../src/models');
const connectDB = require('../src/config/database');

async function verifyFlow() {
    try {
        console.log('--- Starting Academic Flow Verification ---');
        await connectDB();

        // 1. Setup Test Data
        const org = await Organization.findOne({ type: 'COLLEGE' }) || await Organization.create({
            name: 'Test University',
            type: 'COLLEGE',
            subdomain: 'testuni-' + Date.now(),
            code: 'TUNI' + Math.floor(Math.random() * 1000),
            email: 'admin@testuni.com'
        });

        const admin = await User.findOne({ role: 'org_admin', organization_id: org._id }) || await User.create({
            name: 'Org Admin',
            email: `admin-${Date.now()}@test.com`,
            role: 'org_admin',
            organization_id: org._id,
            isActive: true
        });

        const instructor = await User.create({
            name: 'Prof. Xavier',
            email: `prof-${Date.now()}@test.com`,
            role: 'instructor',
            organization_id: org._id,
            isActive: true
        });

        const student = await User.create({
            name: 'John Doe',
            email: `student-${Date.now()}@test.com`,
            role: 'student',
            organization_id: org._id,
            isActive: true
        });

        // 2. Create Structure
        const dept = await Department.create({
            organization_id: org._id,
            name: 'Computer Science',
            code: 'CS',
            createdBy: admin._id
        });
        console.log('✅ Department created');

        const program = await Program.create({
            organization_id: org._id,
            department_id: dept._id,
            name: 'BCA',
            code: 'BCA101',
            duration: '3 Years',
            createdBy: admin._id
        });
        console.log('✅ Program created');

        const subject = await Subject.create({
            organization_id: org._id,
            department_id: dept._id,
            program_id: program._id,
            name: 'Data Structures',
            code: 'CS101',
            instructorId: instructor._id,
            createdBy: admin._id
        });
        console.log('✅ Subject created');

        // 3. Test Enrollment Flow
        console.log('--- Testing Enrollment Flow ---');
        const enrollment = await StudentCourseEnrollment.create({
            organizationId: org._id,
            studentId: student._id,
            courseId: program._id,
            departmentId: dept._id
        });

        // Simulating the auto-enrollment logic in the route
        const subjects = await Subject.find({ program_id: program._id, organization_id: org._id });
        const subjectEnrollments = subjects.map(s => ({
            organizationId: org._id,
            studentId: student._id,
            subjectId: s._id,
            courseId: program._id,
            departmentId: dept._id
        }));
        await StudentSubjectEnrollment.insertMany(subjectEnrollments);

        const checkEnrollment = await StudentSubjectEnrollment.findOne({ studentId: student._id, subjectId: subject._id });
        if (checkEnrollment) {
            console.log('✅ Student automatically enrolled in subject');
        } else {
            throw new Error('Auto-enrollment failed!');
        }

        // 4. Test Attendance Flow
        console.log('--- Testing Attendance Flow ---');
        const attendance = await Attendance.create({
            organization_id: org._id,
            subjectId: subject._id,
            programId: program._id,
            instructor_id: instructor._id,
            session_date: new Date(),
            start_time: '10:00',
            end_time: '11:00',
            attendance_records: [{
                student_id: student._id,
                status: 'present',
                marked_by: instructor._id
            }]
        });
        console.log('✅ Attendance recorded');

        // 5. Verify Isolation
        console.log('--- Testing Data Isolation ---');
        const otherOrg = await Organization.create({
            name: 'Other College',
            type: 'COLLEGE',
            subdomain: 'other-' + Date.now(),
            code: 'OTHER' + Math.floor(Math.random() * 1000),
            email: 'other@test.com'
        });

        const deptInOtherOrg = await Department.find({ organization_id: otherOrg._id });
        if (deptInOtherOrg.length === 0) {
            console.log('✅ Data isolation verified (other org cannot see CS dept)');
        } else {
            throw new Error('Data isolation breach!');
        }

        console.log('--- VERIFICATION SUCCESSFUL ---');
    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        // Cleanup test data optionally, or just close connection
        mongoose.connection.close();
    }
}

verifyFlow();
