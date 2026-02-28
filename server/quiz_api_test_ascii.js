/**
 * COMPREHENSIVE QUIZ API TEST - ASCII output version
 * Run: node quiz_api_test_ascii.js
 */

require('dotenv').config();
const http = require('http');
const https = require('https');

const BASE_URL = process.env.API_TEST_URL || 'http://localhost:5000';

function request(method, path, data, token) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const isHttps = url.protocol === 'https:';
        const lib = isHttps ? https : http;
        const body = data ? JSON.stringify(data) : null;
        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...(body && { 'Content-Length': Buffer.byteLength(body) })
            }
        };
        const req = lib.request(options, (res) => {
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

let passed = 0, failed = 0;
const log = console.log;
const ok = (msg, extra) => { log(`  [PASS] ${msg}${extra ? ' => ' + extra : ''}`); passed++; };
const fail = (msg, extra) => { log(`  [FAIL] ${msg}${extra ? ' => ' + extra : ''}`); failed++; };
const sec = (title) => log(`\n--- ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}`);

async function main() {
    log('COMPREHENSIVE QUIZ API TEST');
    log('Base: ' + BASE_URL);

    // 1. Health
    sec('1. HEALTH CHECK');
    try {
        const h = await request('GET', '/api/health');
        if (h.status === 200) ok('Server healthy');
        else { fail('Server returned ' + h.status); process.exit(1); }
    } catch (e) {
        fail('Cannot reach server: ' + e.message);
        log('   Start the server: npm run dev');
        process.exit(1);
    }

    // 2. Instructor login
    sec('2. INSTRUCTOR LOGIN');
    let iToken, iUser;
    for (const email of ['instructor@test.com', 'khandelwalkritika851@gmail.com', 'instructor@example.com']) {
        const r = await request('POST', '/auth/login', { email, password: 'password123' });
        if (r.status === 200 && r.body.data?.token) {
            iToken = r.body.data.token;
            iUser = r.body.data.user;
            ok('Logged in as ' + email, 'role=' + iUser?.role);
            const orgId = iUser?.organization_id?._id || iUser?.organization_id;
            log('   org_id: ' + orgId);
            break;
        }
    }
    if (!iToken) fail('No instructor found (try: node seed-test-data.js)');

    // 3. Student login
    sec('3. STUDENT LOGIN');
    let sToken, sUser;
    for (const email of ['student1@test.com', 'dushyant@gmail.com', 'nitindushyant9@gmail.com', 'student@test.com']) {
        const r = await request('POST', '/auth/login', { email, password: 'password123' });
        if (r.status === 200 && r.body.data?.token) {
            sToken = r.body.data.token;
            sUser = r.body.data.user;
            ok('Logged in as ' + email, 'role=' + sUser?.role);
            const orgId = sUser?.organization_id?._id || sUser?.organization_id;
            log('   org_id: ' + orgId);
            break;
        }
    }
    if (!sToken) fail('No student found');

    // Org check
    sec('4. ORGANIZATION ISOLATION CHECK');
    if (iUser && sUser) {
        const iOrg = String(iUser?.organization_id?._id || iUser?.organization_id || '');
        const sOrg = String(sUser?.organization_id?._id || sUser?.organization_id || '');
        log('   Instructor org: ' + iOrg);
        log('   Student    org: ' + sOrg);
        if (iOrg && sOrg && iOrg === sOrg) ok('Same organization');
        else fail('DIFFERENT orgs — student WILL NOT see instructor quizzes!');
    }

    // 5. Instructor courses
    sec('5. INSTRUCTOR COURSES');
    let courseId;
    if (iToken) {
        const r = await request('GET', '/instructor/courses', null, iToken);
        log('   HTTP: ' + r.status);
        const courses = Array.isArray(r.body?.data?.courses) ? r.body.data.courses
            : Array.isArray(r.body?.data) ? r.body.data : [];
        if (courses.length > 0) {
            courseId = courses[0]._id;
            ok('Found ' + courses.length + ' course(s)', '"' + courses[0].title + '" id=' + courseId);
        } else {
            fail('No courses found for instructor');
            log('   Raw response: ' + JSON.stringify(r.body).slice(0, 300));
        }
    }

    // 6. Existing published quizzes
    sec('6. INSTRUCTOR PUBLISHED QUIZZES');
    let quizId;
    if (iToken) {
        const r = await request('GET', '/api/quizzes/instructor', null, iToken);
        log('   HTTP: ' + r.status);
        const quizzes = Array.isArray(r.body?.data) ? r.body.data : [];
        const published = quizzes.filter(q => q.status === 'PUBLISHED');
        log('   Total quizzes: ' + quizzes.length + ', Published: ' + published.length);
        if (published.length > 0) {
            quizId = published[0]._id;
            ok('Has published quiz: "' + published[0].title + '"', 'id=' + quizId);
            if (!courseId) courseId = published[0].course_id?._id || published[0].course_id;
        } else {
            log('   No published quiz — will create one');
        }
    }

    // 7. Create + publish if needed
    sec('7. CREATE + PUBLISH TEST QUIZ (if needed)');
    if (iToken && courseId && !quizId) {
        const payload = {
            course_id: courseId,
            title: 'API Test Quiz ' + Date.now(),
            description: 'Auto test',
            questions: [
                { question: '2 + 2 = ?', options: ['3', '4', '5', '6'], correct_answer: 1 },
                { question: 'Sky color?', options: ['Red', 'Blue', 'Green', 'Yellow'], correct_answer: 1 },
                { question: 'Capital of France?', options: ['Berlin', 'Paris', 'Rome', 'Madrid'], correct_answer: 1 }
            ],
            timer_minutes: 10, pass_percentage: 50, max_attempts: 5
        };
        const cr = await request('POST', '/api/quizzes/create', payload, iToken);
        log('   Create HTTP: ' + cr.status);
        if (cr.status === 201) {
            quizId = cr.body.data._id;
            ok('Quiz created', 'id=' + quizId);
            const pr = await request('POST', '/api/quizzes/publish/' + quizId, {}, iToken);
            if (pr.status === 200) ok('Quiz published');
            else fail('Publish failed', JSON.stringify(pr.body).slice(0, 200));
        } else {
            fail('Create failed', JSON.stringify(cr.body).slice(0, 300));
        }
    } else if (quizId) {
        ok('Using existing published quiz');
    } else {
        fail('Need a course to create quiz');
    }

    // 8. STUDENT sees quizzes (core test)
    sec('8. STUDENT QUIZ LISTING (core test)');
    let studentQuizzes = [];
    if (sToken) {
        const r = await request('GET', '/api/quizzes/student', null, sToken);
        log('   HTTP: ' + r.status);
        if (r.status === 200 && r.body.success) {
            studentQuizzes = r.body.data || [];
            ok('Student sees ' + studentQuizzes.length + ' quiz(zes)');
            studentQuizzes.forEach((q, i) => {
                log('   [' + (i + 1) + '] "' + q.title + '"');
                log('       course: ' + (q.course?.title || 'N/A'));
                log('       questions: ' + q.questions_count + ', timer: ' + (q.timer_minutes || 'unlimited') + 'm');
                log('       attempts: ' + q.attemptsCount + '/' + q.max_attempts + ', left: ' + q.attemptsLeft);
                log('       passed: ' + q.hasPassed + ', best: ' + (q.bestPercentage ?? 'N/A') + '%');
            });
        } else {
            fail('Student quiz listing failed', r.status + ' ' + JSON.stringify(r.body).slice(0, 200));
        }
    }

    // 9. Student submits quiz
    sec('9. STUDENT QUIZ SUBMISSION');
    const quizForAttempt = studentQuizzes.find(q => q._id === quizId) || studentQuizzes[0];
    let submitResult;
    if (sToken && quizForAttempt && quizForAttempt.attemptsLeft > 0) {
        log('   Attempting: "' + quizForAttempt.title + '" (' + quizForAttempt._id + ')');
        const answers = quizForAttempt.questions.map((_, idx) => ({
            question_index: idx, selected_option: 1, time_spent_seconds: 20
        }));
        log('   Sending ' + answers.length + ' answers');
        const r = await request('POST', '/api/quizzes/' + quizForAttempt._id + '/submit',
            { answers, started_at: new Date().toISOString() }, sToken);
        log('   HTTP: ' + r.status);
        if (r.status === 200 && r.body.success) {
            submitResult = r.body.data;
            ok('Submitted!', 'score=' + (submitResult.score || submitResult.percentage) + '%, passed=' + submitResult.passed);
            log('   Attempt number: ' + submitResult.attempt_number);
        } else {
            const msg = r.body?.message || r.body?.error || '';
            if (msg.toLowerCase().includes('enroll')) {
                fail('Enrollment required to SUBMIT (viewing is open)');
                log('   Enroll student in course "' + quizForAttempt.course?.title + '" to allow submission');
                log('   Note: student CAN see the quiz, but submit requires enrollment');
            } else {
                fail('Submit failed', r.status + ' ' + JSON.stringify(r.body).slice(0, 300));
            }
        }
    } else if (!quizForAttempt) {
        log('   SKIP - no quizzes visible to student');
    } else {
        log('   SKIP - no attempts left for "' + quizForAttempt.title + '"');
    }

    // 10. Verify updated status
    sec('10. VERIFY ATTEMPT STATUS UPDATED');
    if (sToken && submitResult) {
        const r = await request('GET', '/api/quizzes/student', null, sToken);
        if (r.status === 200) {
            const updated = (r.body.data || []).find(q => q._id === quizForAttempt._id);
            if (updated) {
                ok('Status updated', 'attemptsCount=' + updated.attemptsCount + ', best=' + updated.bestPercentage + '%');
            } else fail('Quiz missing from updated list');
        }
    } else {
        log('   SKIP - no submission to verify');
    }

    // 11. Instructor statistics
    sec('11. INSTRUCTOR QUIZ STATISTICS');
    if (iToken && quizId) {
        const r = await request('GET', '/api/quizzes/' + quizId + '/statistics', null, iToken);
        log('   HTTP: ' + r.status);
        if (r.status === 200 && r.body.success) {
            const stats = r.body.data?.statistics;
            ok('Statistics retrieved');
            log('   Total Attempts: ' + (stats?.total_attempts ?? 'N/A'));
            log('   Avg Score:      ' + (stats?.average_score ?? 'N/A'));
            log('   Pass Rate:      ' + (stats?.pass_rate ?? 'N/A') + '%');
        } else {
            fail('Statistics failed', JSON.stringify(r.body).slice(0, 200));
        }
    }

    // Summary
    log('\n' + '='.repeat(55));
    log('RESULTS: ' + passed + ' passed, ' + failed + ' failed');
    log('='.repeat(55));
    if (failed > 0) { log('Some tests failed.\n'); process.exit(1); }
    else { log('All tests passed!\n'); process.exit(0); }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
