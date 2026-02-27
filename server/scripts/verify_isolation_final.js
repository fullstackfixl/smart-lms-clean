
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const logPath = path.resolve(__dirname, '../../verification_results.log');
const modelsPath = path.resolve(__dirname, '../src/models');
const moduleGuardPath = path.resolve(__dirname, '../src/middleware/moduleGuard');

if (fs.existsSync(logPath)) fs.unlinkSync(logPath);

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logPath, msg + '\n');
}

const moduleGuard = require(moduleGuardPath);

async function verifyIsolation() {
    log('--- STARTING MULTI-TENANT FEATURE ISOLATION VERIFICATION ---');

    const mockRes = {
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) { this.data = data; return this; },
        error: function (msg, detail, code) {
            this.statusCode = code;
            this.data = { success: false, message: msg, detail };
            return this;
        }
    };

    const moduleMapping = {
        'SCHOOL': ["ACADEMIC_YEAR", "GRADES_SECTIONS", "ATTENDANCE", "EXAMS", "PARENT_PORTAL", "COURSES", "REPORTS"],
        'COLLEGE': ["DEPARTMENTS", "SEMESTERS", "SUBJECTS", "GPA_REPORTS", "COURSES", "EXAMS"],
        'INSTITUTE': ["BATCHES", "TEST_SERIES", "TRAINERS", "COURSES", "LEADERBOARDS"],
        'ONLINE_ACADEMY': ["PUBLIC_CATALOG", "COUPONS", "COURSE_SALES", "CERTIFICATES", "STUDENT_ANALYTICS", "COURSES"]
    };

    const allModules = [
        'ACADEMIC_YEAR', 'GRADES_SECTIONS', 'ATTENDANCE', 'EXAMS', 'PARENT_PORTAL', 'COURSES', 'REPORTS',
        'DEPARTMENTS', 'SEMESTERS', 'SUBJECTS', 'GPA_REPORTS',
        'BATCHES', 'TEST_SERIES', 'TRAINERS', 'LEADERBOARDS',
        'PUBLIC_CATALOG', 'COUPONS', 'COURSE_SALES', 'CERTIFICATES', 'STUDENT_ANALYTICS'
    ];

    let totalTests = 0;
    let totalPass = 0;
    let totalFail = 0;

    for (const [type, enabledModules] of Object.entries(moduleMapping)) {
        log(`\n> Testing Organization Type: ${type}`);

        const mockUser = {
            organization_id: new mongoose.Types.ObjectId(),
            modulesEnabled: enabledModules
        };

        for (const mod of allModules) {
            totalTests++;
            const req = { user: mockUser };
            const res = { ...mockRes };
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            try {
                const guard = moduleGuard(mod);
                guard(req, res, next);

                const shouldBeAllowed = enabledModules.includes(mod);
                const actuallyAllowed = nextCalled;

                if (shouldBeAllowed === actuallyAllowed) {
                    // log(`  [PASS] Module: ${mod.padEnd(20)} - Result: ${actuallyAllowed ? 'ALLOWED' : 'BLOCKED'}`);
                    totalPass++;
                } else {
                    log(`  [FAIL] Module: ${mod.padEnd(20)} - Expected: ${shouldBeAllowed ? 'ALLOWED' : 'BLOCKED'} - Actual: ${actuallyAllowed ? 'ALLOWED' : 'BLOCKED'}`);
                    totalFail++;
                }
            } catch (err) {
                log(`  [ERROR] Module: ${mod.padEnd(19)} - Exception: ${err.message}`);
                totalFail++;
            }
        }
    }

    log('\n--- VERIFICATION SUMMARY ---');
    log(`Total tests run: ${totalTests}`);
    log(`Passed: ${totalPass}`);
    log(`Failed: ${totalFail}`);
    log('------------------------------------------------');

    if (totalFail === 0) {
        log('✅ ALL FEATURE ISOLATION TESTS PASSED SUCCESSFULLY.');
    } else {
        log('❌ SOME FEATURE ISOLATION TESTS FAILED. PLEASE REVIEW THE LOGS.');
    }
}

verifyIsolation().catch(log);
