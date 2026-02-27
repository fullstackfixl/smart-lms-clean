
const mongoose = require('mongoose');

const moduleMapping = {
    'SCHOOL': [
        "ACADEMIC_YEAR",
        "GRADES_SECTIONS",
        "ATTENDANCE",
        "EXAMS",
        "PARENT_PORTAL",
        "COURSES",
        "REPORTS"
    ],
    'COLLEGE': [
        "DEPARTMENTS",
        "SEMESTERS",
        "SUBJECTS",
        "GPA_REPORTS",
        "COURSES",
        "EXAMS"
    ],
    'INSTITUTE': [
        "BATCHES",
        "TEST_SERIES",
        "TRAINERS",
        "COURSES",
        "LEADERBOARDS"
    ],
    'ONLINE_ACADEMY': [
        "PUBLIC_CATALOG",
        "COUPONS",
        "COURSE_SALES",
        "CERTIFICATES",
        "STUDENT_ANALYTICS"
    ]
};

async function run() {
    try {
        const mongoUri = "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(mongoUri);

        const Organization = require('../src/models/Organization');
        const OrganizationApplication = require('../src/models/OrganizationApplication');

        console.log('--- BACKFILLING ORGANIZATIONS ---');
        const orgs = await Organization.find();
        for (const org of orgs) {
            const type = (org.type || '').toUpperCase();
            const expectedModules = moduleMapping[type] || moduleMapping['SCHOOL']; // default to School for legacy

            if (!org.modulesEnabled || org.modulesEnabled.length === 0) {
                org.modulesEnabled = expectedModules;
                org.type = type || 'SCHOOL'; // ensure type is formal
                org.templateVersion = `v1_${(type || 'SCHOOL').toLowerCase()}`;
                await org.save();
                console.log(`✅ Updated Org: "${org.name}" Type: ${org.type} with ${expectedModules.length} modules.`);
            } else {
                console.log(`ℹ️ Skipping Org: "${org.name}" (Already has ${org.modulesEnabled.length} modules)`);
            }
        }

        console.log('\n--- BACKFILLING APPLICATIONS (Approved but no modules) ---');
        const apps = await OrganizationApplication.find({ status: 'approved' });
        for (const app of apps) {
            const type = (app.organization_type || '').toUpperCase();
            const expectedModules = moduleMapping[type] || moduleMapping['SCHOOL'];

            if (!app.modulesEnabled || app.modulesEnabled.length === 0) {
                app.modulesEnabled = expectedModules;
                app.organization_type = type || 'SCHOOL';
                await app.save();
                console.log(`✅ Updated App for: "${app.organization_name}" Type: ${app.organization_type} with modules.`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err);
        process.exit(1);
    }
}

run();
