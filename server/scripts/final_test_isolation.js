
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Fix paths relative to the script location
const modelsPath = path.resolve(__dirname, '../src/models');
const moduleGuardPath = path.resolve(__dirname, '../src/middleware/moduleGuard');
const logPath = path.resolve(__dirname, '../../test_results.log');

const { Organization, User } = require(modelsPath);
const moduleGuard = require(moduleGuardPath);

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logPath, msg + '\n');
}

async function testFeatureIsolation() {
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
    log('--- STARTING COMPREHENSIVE FEATURE ISOLATION TEST ---');

    const mockRes = {
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) { this.data = data; return this; },
        error: function (msg, detail, code) {
            this.statusCode = code;
            this.data = { success: false, message: msg, detail };
            return this;
        }
    };

    const orgTypes = ['SCHOOL', 'COLLEGE', 'INSTITUTE', 'ONLINE_ACADEMY'];
    const modules = [
        'ACADEMIC_YEAR', 'GRADES_SECTIONS', 'ATTENDANCE', 'EXAMS', 'PARENT_PORTAL', 'COURSES', 'REPORTS',
        'DEPARTMENTS', 'SEMESTERS', 'SUBJECTS', 'GPA_REPORTS',
        'BATCHES', 'TEST_SERIES', 'TRAINERS', 'LEADERBOARDS',
        'PUBLIC_CATALOG', 'COUPONS', 'COURSE_SALES', 'CERTIFICATES', 'STUDENT_ANALYTICS'
    ];

    const moduleMapping = {
        'SCHOOL': ["ACADEMIC_YEAR", "GRADES_SECTIONS", "ATTENDANCE", "EXAMS", "PARENT_PORTAL", "COURSES", "REPORTS"],
        'COLLEGE': ["DEPARTMENTS", "SEMESTERS", "SUBJECTS", "GPA_REPORTS", "COURSES", "EXAMS"],
        'INSTITUTE': ["BATCHES", "TEST_SERIES", "TRAINERS", "COURSES", "LEADERBOARDS"],
        'ONLINE_ACADEMY': ["PUBLIC_CATALOG", "COUPONS", "COURSE_SALES", "CERTIFICATES", "STUDENT_ANALYTICS", "COURSES"]
    };

    for (const type of orgTypes) {
        console.log(`\nTesting Org Type: ${type}`);
        const enabledModules = moduleMapping[type];

        const mockUser = {
            organization_id: new mongoose.Types.ObjectId(),
            modulesEnabled: enabledModules
        };

        for (const mod of modules) {
            const req = { user: mockUser };
            const res = { ...mockRes };
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            const guard = moduleGuard(mod);
            guard(req, res, next);

            const isEnabled = enabledModules.includes(mod);
            if (isEnabled) {
                if (nextCalled) {
                    // console.log(`  [PASS] ${mod} is enabled and allowed.`);
                } else {
                    console.error(`  [FAIL] ${mod} is enabled but BLOCKED.`);
                }
            } else {
                if (!nextCalled && res.statusCode === 403) {
                    // console.log(`  [PASS] ${mod} is disabled and BLOCKED.`);
                } else {
                    console.error(`  [FAIL] ${mod} is disabled but ALLOWED (nextCalled: ${nextCalled}, status: ${res.statusCode}).`);
                }
            }
        }
    }

    console.log('\n--- FEATURE ISOLATION TEST COMPLETE ---');
}

// We need to connect to DB or mock models if moduleGuard needs them
// But our moduleGuard just checks req.user.modulesEnabled
testFeatureIsolation().catch(console.error);
