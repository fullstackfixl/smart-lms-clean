/**
 * Verification Script: Test Module Assignment Logic
 * Run: node scripts/verify_modules.js
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const OrganizationApplication = require('../src/models/OrganizationApplication');
const Organization = require('../src/models/Organization');

const moduleMapping = {
    'SCHOOL': ["ACADEMIC_YEAR", "GRADES_SECTIONS", "ATTENDANCE", "EXAMS", "PARENT_PORTAL", "COURSES", "REPORTS"],
    'COLLEGE': ["DEPARTMENTS", "SEMESTERS", "SUBJECTS", "GPA_REPORTS", "COURSES", "EXAMS"],
    'INSTITUTE': ["BATCHES", "TEST_SERIES", "TRAINERS", "COURSES", "LEADERBOARDS"],
    'ONLINE_ACADEMY': ["PUBLIC_CATALOG", "COUPONS", "COURSE_SALES", "CERTIFICATES", "STUDENT_ANALYTICS"]
};

async function verify() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        for (const [type, expectedModules] of Object.entries(moduleMapping)) {
            console.log(`\n🧪 Testing ${type}...`);

            // 1. Simulate Application
            const app = new OrganizationApplication({
                organization_name: `Test ${type}`,
                subdomain: `test-${type.toLowerCase()}-${Date.now()}`,
                admin_name: 'Admin',
                admin_email: `admin@${type.toLowerCase()}${Date.now()}.com`,
                selected_plan: 'basic',
                organization_type: type
            });

            // 2. Simulate Approval (logic from PlatformApplicationController)
            app.modulesEnabled = expectedModules;
            app.status = 'approved';
            await app.save();
            console.log(`   - Application created and modules assigned: [${app.modulesEnabled.join(', ')}]`);

            // 3. Simulate Registration completion (logic from AuthService)
            const org = new Organization({
                name: app.organization_name,
                subdomain: app.subdomain,
                plan: app.selected_plan,
                type: type,
                modulesEnabled: app.modulesEnabled,
                templateVersion: `v1_${type.toLowerCase()}`,
                status: 'active'
            });
            await org.save();
            console.log(`   - Organization created with modules: [${org.modulesEnabled.join(', ')}]`);

            // Verification
            const success = JSON.stringify(org.modulesEnabled.sort()) === JSON.stringify([...expectedModules].sort());
            if (success) {
                console.log(`   ✅ SUCCESS: Modules match expected mapping for ${type}`);
            } else {
                console.error(`   ❌ FAILURE: Modules do NOT match for ${type}`);
            }

            // Cleanup
            await OrganizationApplication.deleteOne({ _id: app._id });
            await Organization.deleteOne({ _id: org._id });
        }

    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

verify();
