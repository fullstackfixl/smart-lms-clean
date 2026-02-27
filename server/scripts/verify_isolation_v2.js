
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const logPath = path.resolve(__dirname, '../../verification_results_final.log');
const modelsPath = path.resolve(__dirname, '../src/models');
const moduleGuardPath = path.resolve(__dirname, '../src/middleware/moduleGuard');

if (fs.existsSync(logPath)) fs.unlinkSync(logPath);

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logPath, msg + '\n');
}

const moduleGuard = require(moduleGuardPath);

async function verifyIsolation() {
    log('--- STARTING MULTI-TENANT FEATURE ISOLATION VERIFICATION (V2) ---');

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

    const allTestCases = [
        { mod: 'ACADEMIC_YEAR', types: ['SCHOOL'] },
        { mod: 'GRADES_SECTIONS', types: ['SCHOOL'] }, // College uses Exams but maybe grades later
        { mod: 'ATTENDANCE', types: ['SCHOOL'] },
        { mod: 'EXAMS', types: ['SCHOOL', 'COLLEGE'] },
        { mod: 'PARENT_PORTAL', types: ['SCHOOL'] },
        { mod: 'REPORTS', types: ['SCHOOL'] },
        { mod: 'DEPARTMENTS', types: ['COLLEGE'] },
        { mod: 'SEMESTERS', types: ['COLLEGE'] },
        { mod: 'SUBJECTS', types: ['COLLEGE'] },
        { mod: 'GPA_REPORTS', types: ['COLLEGE'] },
        { mod: 'BATCHES', types: ['INSTITUTE'] },
        { mod: 'TEST_SERIES', types: ['INSTITUTE'] },
        { mod: 'TRAINERS', types: ['INSTITUTE'] },
        { mod: 'LEADERBOARDS', types: ['INSTITUTE'] },
        { mod: 'PUBLIC_CATALOG', types: ['ONLINE_ACADEMY'] },
        { mod: 'COUPONS', types: ['ONLINE_ACADEMY'] },
        { mod: 'COURSE_SALES', types: ['ONLINE_ACADEMY'] },
        { mod: 'CERTIFICATES', types: ['ONLINE_ACADEMY'] },
        { mod: 'STUDENT_ANALYTICS', types: ['ONLINE_ACADEMY'] },
        { mod: 'COURSES', types: ['SCHOOL', 'COLLEGE', 'INSTITUTE', 'ONLINE_ACADEMY'] },
        { mod: ['REPORTS', 'STUDENT_ANALYTICS'], types: ['SCHOOL', 'ONLINE_ACADEMY'] } // Combined analytics
    ];

    let totalTests = 0;
    let totalPass = 0;
    let totalFail = 0;

    for (const [type, enabledModules] of Object.entries(moduleMapping)) {
        log(`\n> Testing Organization Type: ${type}`);

        const mockUser = {
            organization_id: new mongoose.Types.ObjectId(),
            modulesEnabled: enabledModules,
            role: 'admin'
        };

        for (const testCase of allTestCases) {
            totalTests++;
            const req = { user: mockUser };
            const res = { ...mockRes };
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            try {
                const guard = moduleGuard(testCase.mod);
                guard(req, res, next);

                const shouldBeAllowed = testCase.types.includes(type);
                const actuallyAllowed = nextCalled;

                if (shouldBeAllowed === actuallyAllowed) {
                    totalPass++;
                } else {
                    log(`  [FAIL] Module: ${JSON.stringify(testCase.mod).padEnd(30)} - Expected: ${shouldBeAllowed ? 'ALLOWED' : 'BLOCKED'} - Actual: ${actuallyAllowed ? 'ALLOWED' : 'BLOCKED'}`);
                    totalFail++;
                }
            } catch (err) {
                log(`  [ERROR] Module: ${JSON.stringify(testCase.mod).padEnd(29)} - Exception: ${err.message}`);
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
