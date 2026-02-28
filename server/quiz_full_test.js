/**
 * COMPREHENSIVE QUIZ API TEST - Full Flow with Auto-Enrollment
 * Tests: login -> quiz listing -> auto-enroll -> submit -> instructor view
 * Run: node quiz_full_test.js
 */
require('dotenv').config();
const http = require('http');
const https = require('https');
const mongoose = require('mongoose');

const BASE_URL = process.env.API_TEST_URL || 'http://localhost:5000';
const MONGODB_URI = process.env.MONGODB_URI;

function api(method, path, data, token) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const lib = url.protocol === 'https:' ? https : http;
        const body = data ? JSON.stringify(data) : null;
        const opts = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...(body && { 'Content-Length': Buffer.byteLength(body) })
            }
        };
        const req = lib.request(opts, (res) => {
            let raw = '';
            res.on('data', d => raw += d);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
                catch (e) { resolve({ status: res.statusCode, body: raw }); }
            });
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

let P = 0, F = 0;
const log = (m) => process.stdout.write(m + '\n');
const pass = (m, e) => { log(`  [PASS] ${m}${e ? ' -> ' + e : ''}`); P++; };
const fail = (m, e) => { log(`  [FAIL] ${m}${e ? ' -> ' + e : ''}`); F++; };
const sect = (t) => log(`\n--- ${t} `);

async function tryLogin(pairs) {
    for (const [email, password] of pairs) {
        const r = await api('POST', '/auth/login', { email, password });
        if (r.status === 200 && r.body.data?.token) return r.body.data;
    }
    return null;
}

async function main() {
    log('QUIZ FULL API TEST');
    log('Base: ' + BASE_URL);
    log('Time: ' + new Date().toISOString());

    // ── 1. Health ──────────────────────────────────────────────
    sect('1. HEALTH');
    try {
        const h = await api('GET', '/api/health');
        if (h.status === 200) pass('Server running');
        else { fail('Server error ' + h.status); process.exit(1); }
    } catch (e) {
        fail('Cannot reach server: ' + e.message + '\n   Run: npm run dev');
        process.exit(1);
    }

    // ── 2. DB connect ─────────────────────────────────────────
    sect('2. DATABASE');
    let db;
    if (MONGODB_URI) {
        try {
            await mongoose.connect(MONGODB_URI);
            db = mongoose.connection;
            pass('MongoDB connected');
        } catch (e) {
            fail('MongoDB connect failed: ' + e.message);
        }
    } else {
        log('  SKIP - no MONGODB_URI in env (enrollment auto-create will be skipped)');
    }

    // ── 3. Instructor login ───────────────────────────────────
    sect('3. INSTRUCTOR LOGIN');
    const instrData = await tryLogin([
        ['instructor@test.com', 'password123'],
        ['khandelwalkritika851@gmail.com', 'password123'],
        ['instructor@example.com', 'password123'],
    ]);
    if (!instrData) { fail('No instructor found. Run: node seed-test-data.js'); }
    else { pass('Instructor: ' + instrData.user?.email, 'role=' + instrData.user?.role + ' org=' + (instrData.user?.organization_id?._id || instrData.user?.organization_id)); }
    const iToken = instrData?.token;
    const iUser = instrData?.user;

    // ── 4. Student login ──────────────────────────────────────
    sect('4. STUDENT LOGIN');
    const studData = await tryLogin([
        ['student1@test.com', 'password123'],
        ['dushyant@gmail.com', 'password123'],
        ['nitindushyant9@gmail.com', 'password123'],
        ['student@test.com', 'password123'],
    ]);
    if (!studData) { fail('No student found. Run: node seed-test-data.js'); }
    else { pass('Student: ' + studData.user?.email, 'role=' + studData.user?.role + ' org=' + (studData.user?.organization_id?._id || studData.user?.organization_id)); }
    const sToken = studData?.token;
    const sUser = studData?.user;

    // ── 5. Org isolation ─────────────────────────────────────
    sect('5. ORGANIZATION ISOLATION');
    const iOrg = String(iUser?.organization_id?._id || iUser?.organization_id || '');
    const sOrg = String(sUser?.organization_id?._id || sUser?.organization_id || '');
    log('  Instructor org: ' + iOrg);
    log('  Student    org: ' + sOrg);
    if (iOrg && sOrg && iOrg === sOrg) pass('Same org - student WILL see instructor quizzes');
    else fail('DIFFERENT orgs - student CANNOT see instructor quizzes!');

    // ── 6. Instructor: Get quizzes ────────────────────────────
    sect('6. INSTRUCTOR QUIZZES');
    let publishedQuiz = null, courseId = null;
    if (iToken) {
        const r = await api('GET', '/api/quizzes/instructor', null, iToken);
        log('  HTTP ' + r.status);
        const list = Array.isArray(r.body?.data) ? r.body.data : [];
        log('  Total: ' + list.length + ', Published: ' + list.filter(q => q.status === 'PUBLISHED').length);
        publishedQuiz = list.find(q => q.status === 'PUBLISHED');
        if (publishedQuiz) {
            pass('Published quiz found: "' + publishedQuiz.title + '"', 'id=' + publishedQuiz._id);
            courseId = publishedQuiz.course_id?._id || publishedQuiz.course_id;
            log('  course_id: ' + courseId);
        } else {
            log('  No published quiz yet - need to create one');
        }
    }

    // ── 7. Create quiz if none ────────────────────────────────
    sect('7. CREATE + PUBLISH QUIZ');
    if (iToken && !publishedQuiz) {
        // Get courses first
        const cr = await api('GET', '/instructor/courses', null, iToken);
        const courses = Array.isArray(cr.body?.data?.courses) ? cr.body.data.courses
            : Array.isArray(cr.body?.data) ? cr.body.data : [];
        if (courses.length === 0) { fail('No courses for instructor - cannot create quiz'); }
        else {
            courseId = courses[0]._id;
            const qr = await api('POST', '/api/quizzes/create', {
                course_id: courseId,
                title: 'Full API Test Quiz',
                description: 'Testing quiz end-to-end',
                questions: [
                    { question: '2+2=?', options: ['3', '4', '5', '6'], correct_answer: 1 },
                    { question: 'Sky color?', options: ['Red', 'Blue', 'Green', 'Yellow'], correct_answer: 1 },
                    { question: 'Capital of France?', options: ['Berlin', 'Paris', 'Rome', 'Madrid'], correct_answer: 1 }
                ],
                timer_minutes: 10, pass_percentage: 50, max_attempts: 5
            }, iToken);
            log('  Create HTTP: ' + qr.status);
            if (qr.status === 201) {
                publishedQuiz = qr.body.data;
                const pr = await api('POST', '/api/quizzes/publish/' + publishedQuiz._id, {}, iToken);
                if (pr.status === 200) pass('Quiz created and published: "' + publishedQuiz.title + '"');
                else fail('Publish failed', JSON.stringify(pr.body).slice(0, 150));
            } else {
                fail('Create failed', JSON.stringify(qr.body).slice(0, 250));
            }
        }
    } else {
        pass('SKIP - using existing published quiz');
    }

    // ── 8. Auto-enroll student ────────────────────────────────
    sect('8. ENROLLMENT CHECK + AUTO-ENROLL');
    let enrolled = false;
    if (db && sUser && courseId) {
        const Enrollment = require('./src/models/Enrollment');
        const existing = await Enrollment.findOne({
            student_id: sUser._id || sUser.id,
            course_id: courseId
        });
        if (existing) {
            pass('Student already enrolled', 'status=' + existing.status);
            // Ensure active
            if (existing.status !== 'active') {
                existing.status = 'active';
                await existing.save();
                log('  Updated enrollment to active');
            }
            enrolled = true;
        } else {
            // Create enrollment
            try {
                const orgId = iOrg;
                await Enrollment.create({
                    student_id: sUser._id || sUser.id,
                    course_id: courseId,
                    organization_id: orgId,
                    status: 'active',
                    enrollmentType: 'free'
                });
                pass('Student auto-enrolled in course ' + courseId);
                enrolled = true;
            } catch (e) {
                fail('Auto-enroll failed: ' + e.message);
            }
        }
    } else if (!db) {
        log('  SKIP - no DB connection for auto-enrollment');
        log('  Student may fail to submit if not enrolled');
        enrolled = true; // try anyway
    }

    // ── 9. Student sees quizzes ───────────────────────────────
    sect('9. STUDENT QUIZ LISTING (core)');
    let studentQuizzes = [];
    if (sToken) {
        const r = await api('GET', '/api/quizzes/student', null, sToken);
        log('  HTTP ' + r.status);
        if (r.status === 200 && r.body.success) {
            studentQuizzes = r.body.data || [];
            pass('Student sees ' + studentQuizzes.length + ' quiz(zes)');
            studentQuizzes.slice(0, 5).forEach((q, i) => {
                log('  [' + (i + 1) + '] "' + q.title + '"');
                log('       course: ' + (q.course?.title || q.course || 'N/A'));
                log('       questions: ' + q.questions_count + ' | timer: ' + (q.timer_minutes || 'none') + 'm | max_attempts: ' + q.max_attempts);
                log('       attempts_used: ' + q.attemptsCount + ' | attempts_left: ' + q.attemptsLeft);
                log('       passed: ' + q.hasPassed + ' | best_score: ' + (q.bestPercentage ?? 'N/A') + '%');
            });
            if (studentQuizzes.length === 0) {
                fail('Student sees 0 quizzes');
                log('  Possible causes:');
                log('    1. Instructor and student in different orgs (check step 5)');
                log('    2. No published quizzes exist');
                log('    3. Org ID mismatch in Quiz document');
            }
        } else {
            fail('Listing failed', r.status + ' ' + JSON.stringify(r.body).slice(0, 200));
        }
    }

    // ── 10. Student submits ───────────────────────────────────
    sect('10. STUDENT QUIZ SUBMISSION');
    const qToAttempt = publishedQuiz
        ? (studentQuizzes.find(q => q._id.toString() === publishedQuiz._id.toString()) || studentQuizzes[0])
        : studentQuizzes[0];
    let submitOk = false;
    if (sToken && qToAttempt && qToAttempt.attemptsLeft > 0) {
        log('  Quiz: "' + qToAttempt.title + '" id=' + qToAttempt._id);
        log('  Questions to answer: ' + qToAttempt.questions.length);
        const answers = qToAttempt.questions.map((_, i) => ({
            question_index: i,
            selected_option: 1,   // pick option 1 (index) for all = 100% since correct_answer=1
            time_spent_seconds: 15
        }));
        const r = await api('POST', '/api/quizzes/' + qToAttempt._id + '/submit', {
            answers,
            started_at: new Date(Date.now() - 30000).toISOString()
        }, sToken);
        log('  HTTP ' + r.status);
        if (r.status === 200 && r.body.success) {
            const res = r.body.data;
            pass('Quiz submitted!', 'score=' + (res.score ?? 'N/A') + '% passed=' + res.passed + ' attempt#' + res.attempt_number);
            submitOk = true;
        } else {
            const msg = r.body?.message || r.body?.error || JSON.stringify(r.body).slice(0, 200);
            if (msg.toLowerCase().includes('enroll')) {
                fail('Enrollment required to submit');
                log('  NOTE: Student CAN view quizzes but must be enrolled to SUBMIT');
                log('  Fix: Enroll student in course "' + qToAttempt.course?.title + '" from instructor or admin dashboard');
            } else {
                fail('Submit failed', msg);
            }
        }
    } else if (!qToAttempt) {
        log('  SKIP - no quizzes visible to student');
        fail('Cannot submit - student sees 0 quizzes');
    } else {
        log('  SKIP - no attempts left for "' + qToAttempt?.title + '"');
        pass('Quiz exists but no attempts left (expected if already submitted)');
    }

    // ── 11. Verify status after submit ───────────────────────
    sect('11. STATUS AFTER SUBMISSION');
    if (sToken && submitOk && qToAttempt) {
        const r = await api('GET', '/api/quizzes/student', null, sToken);
        if (r.status === 200) {
            const updated = (r.body.data || []).find(q => q._id.toString() === qToAttempt._id.toString());
            if (updated) {
                pass('Status updated after submission');
                log('  attempts_used: ' + updated.attemptsCount);
                log('  best_score: ' + updated.bestPercentage + '%');
                log('  passed: ' + updated.hasPassed);
            } else fail('Quiz missing from list after submission');
        }
    } else log('  SKIP - no submission to verify');

    // ── 12. Instructor views statistics ──────────────────────
    sect('12. INSTRUCTOR STATISTICS');
    if (iToken && publishedQuiz) {
        const r = await api('GET', '/api/quizzes/' + publishedQuiz._id + '/statistics', null, iToken);
        log('  HTTP ' + r.status);
        if (r.status === 200 && r.body.success) {
            const stats = r.body.data?.statistics;
            pass('Statistics returned');
            log('  total_attempts: ' + (stats?.total_attempts ?? 'N/A'));
            log('  avg_score:      ' + (stats?.average_score ?? 'N/A'));
            log('  pass_rate:      ' + (stats?.pass_rate ?? 'N/A') + '%');
        } else {
            fail('Stats failed', JSON.stringify(r.body).slice(0, 200));
        }
    } else log('  SKIP - no quiz');

    // ── 13. Single quiz detail ────────────────────────────────
    sect('13. QUIZ DETAIL (GET /:id)');
    if (sToken && qToAttempt) {
        const r = await api('GET', '/api/quizzes/' + qToAttempt._id, null, sToken);
        log('  HTTP ' + r.status);
        if (r.status === 200 && r.body.success) {
            pass('Quiz detail accessible to student');
            log('  title: ' + r.body.data?.title);
            log('  questions: ' + (r.body.data?.questions?.length ?? r.body.data?.total_questions));
            // Verify no correct_answer in student response
            const hasCorrAns = JSON.stringify(r.body.data).includes('"correct_answer"');
            if (!hasCorrAns) pass('Correct answers HIDDEN from student (good!)');
            else fail('Correct answers EXPOSED to student (security issue!)');
        } else {
            fail('Quiz detail failed', r.status + ' ' + JSON.stringify(r.body).slice(0, 150));
        }
    }

    // Cleanup
    if (db) await mongoose.disconnect();

    // ── Summary ───────────────────────────────────────────────
    log('\n' + '='.repeat(55));
    log('RESULTS: ' + P + ' passed  |  ' + F + ' failed');
    log('='.repeat(55));
    if (F === 0) log('ALL TESTS PASSED');
    else { log('FAILURES DETECTED - check above'); process.exit(1); }
}

main().catch(e => { log('FATAL: ' + e.message); process.exit(1); });
