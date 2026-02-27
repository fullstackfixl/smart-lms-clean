/**
 * Seed default organization templates.
 * Run: node scripts/seedTemplates.js
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TEMPLATES = [
    {
        name: 'School Template',
        type: 'SCHOOL',
        modulesEnabled: [
            "ACADEMIC_YEAR",
            "GRADES_SECTIONS",
            "ATTENDANCE",
            "EXAMS",
            "PARENT_PORTAL",
            "COURSES",
            "REPORTS"
        ],
        defaultRoles: ['org_admin', 'instructor', 'student', 'parent'],
        dashboardConfig: {
            widgets: ['academic_year', 'grades_sections', 'attendance_summary', 'fee_collection', 'upcoming_events'],
            sidebarItems: ['Dashboard', 'Users', 'Academic Year', 'Grades & Sections', 'Attendance', 'Exams', 'Parent Portal', 'Courses', 'Reports', 'Settings']
        },
        version: 1
    },
    {
        name: 'College Template',
        type: 'COLLEGE',
        modulesEnabled: [
            "DEPARTMENTS",
            "SEMESTERS",
            "SUBJECTS",
            "GPA_REPORTS",
            "COURSES",
            "EXAMS"
        ],
        defaultRoles: ['org_admin', 'instructor', 'student'],
        dashboardConfig: {
            widgets: ['departments', 'semesters', 'gpa_reports', 'upcoming_events'],
            sidebarItems: ['Dashboard', 'Users', 'Departments', 'Semesters', 'Subjects', 'Courses', 'Exams', 'GPA Reports', 'Settings']
        },
        version: 1
    },
    {
        name: 'Institute Template',
        type: 'INSTITUTE',
        modulesEnabled: [
            "BATCHES",
            "TEST_SERIES",
            "TRAINERS",
            "COURSES",
            "LEADERBOARDS"
        ],
        defaultRoles: ['org_admin', 'instructor', 'student'],
        dashboardConfig: {
            widgets: ['batches', 'test_series', 'leaderboard', 'upcoming_events'],
            sidebarItems: ['Dashboard', 'Users', 'Batches', 'Test Series', 'Trainers', 'Courses', 'Leaderboards', 'Settings']
        },
        version: 1
    },
    {
        name: 'Online Academy Template',
        type: 'ONLINE_ACADEMY',
        modulesEnabled: [
            "PUBLIC_CATALOG",
            "COUPONS",
            "COURSE_SALES",
            "CERTIFICATES",
            "STUDENT_ANALYTICS"
        ],
        defaultRoles: ['org_admin', 'instructor', 'student'],
        dashboardConfig: {
            widgets: ['public_catalog', 'course_sales', 'student_analytics', 'certificates_issued'],
            sidebarItems: ['Dashboard', 'Users', 'Courses', 'Reports', 'Certificates', 'Events', 'Settings']
        },
        version: 1
    }
];

async function seedTemplates() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const OrgTemplate = require('../src/models/OrgTemplate');

        for (const tmpl of TEMPLATES) {
            const result = await OrgTemplate.findOneAndUpdate(
                { type: tmpl.type },
                { $set: tmpl },
                { upsert: true, new: true }
            );
            console.log(`✅ Upserted template: ${result.name} (${result.type})`);
        }

        console.log('\n✨ All templates seeded successfully!');
    } catch (error) {
        console.error('❌ Seed failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

seedTemplates();
