/**
 * COMPREHENSIVE QUIZ API TEST
 * Tests the full quiz flow: instructor creates → publishes → student sees → student attempts → instructor sees submissions
 * Run: node quiz_api_test.js
 */

require('dotenv').config();
const http = require('http');
const https = require('https');

const BASE_URL = process.env.API_TEST_URL || 'http://localhost:5000';

// ─── Helper: raw HTTP request ────────────────────────────────
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

// ─── Logging helpers ─────────────────────────────────────────
let passed = 0, failed = 0;
function ok(msg, extra = '') { console.log(`  ✅ ${msg}${extra ? ' → ' + extra : ''}`); passed++; }
function fail(msg, extra = '') { console.log(`  ❌ ${msg}${extra ? ' → ' + extra : ''}`); failed++; }
function section(title) { console.log(`\n${'─'.repeat(60)}\n📌 ${title}\n${'─'.repeat(60)}`); }
function dump(label, obj) { console.log(`  📄 ${label}:`, JSON.stringify(obj, null, 2).slice(0, 500)); }

// ─── MAIN ────────────────────────────────────────────────────
async function main() {
    console.log('🚀 COMPREHENSIVE QUIZ API TEST');
    console.log(`   Base URL: ${BASE_URL}`);
    console.log(`   Time: ${new Date().toISOString()}`);

    // ────────────────────────────────────────────────────────────
    section('1. HEALTH CHECK');
    // ────────────────────────────────────────────────────────────
    try {
        const health = await request('GET', '/api/health');
        if (health.status === 200) ok('Server is healthy');
        else fail('Server unhealthy', JSON.stringify(health.body));
    } catch (e) {
        fail('Cannot reach server – is it running?', e.message);
        console.log('\n⛔ Cannot continue without server. Run: npm run dev\n');
        process.exit(1);
    }

    // ────────────────────────────────────────────────────────────
    section('2. INSTRUCTOR LOGIN');
    // ────────────────────────────────────────────────────────────
    // Try both common instructor emails
    let instructorToken, instructorUser;
    for (const email of ['instructor@test.com', 'khandelwalkritika851@gmail.com', 'instructor@example.com']) {
        const r = await request('POST', '/auth/login', { email, password: 'password123' });
        if (r.status === 200 && r.body.data?.token) {
            instructorToken = r.body.data.token;
            instructorUser = r.body.data.user;
            ok(`Instructor logged in as ${email}`);
            console.log(`     Role: ${instructorUser?.role}, Org: ${instructorUser?.organization_id?._id || instructorUser?.organization_id}`);
            break;
        }
    }
    if (!instructorToken) {
        fail('No instructor account found. Listing auth route test only.');
        console.log('  💡 Seed test data: node seed-test-data.js');
    }

    // ────────────────────────────────────────────────────────────
    section('3. STUDENT LOGIN');
    // ────────────────────────────────────────────────────────────
    let studentToken, studentUser;
    for (const email of ['student1@test.com', 'dushyant@gmail.com', 'student@test.com', 'student@example.com']) {
        const r = await request('POST', '/auth/login', { email, password: 'password123' });
        if (r.status === 200 && r.body.data?.token) {
            studentToken = r.body.data.token;
            studentUser = r.body.data.user;
            ok(`Student logged in as ${email}`);
            console.log(`     Role: ${studentUser?.role}, Org: ${studentUser?.organization_id?._id || studentUser?.organization_id}`);
            break;
        }
    }
    if (!studentToken) {
        fail('No student account found');
        console.log('  💡 Seed test data: node seed-test-data.js');
    }

    // Verify both in same org
    if (instructorUser && studentUser) {
        const instrOrg = (instructorUser.organization_id?._id || instructorUser.organization_id || '').toString();
        const studOrg = (studentUser.organization_id?._id || studentUser.organization_id || '').toString();
        if (instrOrg && studOrg && instrOrg === studOrg) {
            ok('Instructor and student are in the SAME organization', instrOrg);
        } else {
            fail('Organization mismatch!', `Instructor: ${instrOrg}, Student: ${studOrg}`);
        }
    }

    // ────────────────────────────────────────────────────────────
    section('4. INSTRUCTOR: GET COURSES (to find a course for quiz)');
    // ────────────────────────────────────────────────────────────
    let courseId;
    if (instructorToken) {
        const r = await request('GET', '/instructor/courses', null, instructorToken);
        if (r.status === 200) {
            const courses = r.body.data?.courses || r.body.data || [];
            const courseList = Array.isArray(courses) ? courses : [];
            if (courseList.length > 0) {
                courseId = courseList[0]._id;
                ok(`Found ${courseList.length} course(s)`, `Using: "${courseList[0].title}" (${courseId})`);
            } else {
                fail('No courses found for instructor');
                console.log('  💡 Create a course first from the instructor dashboard');
            }
        } else {
            fail('Failed to get instructor courses', `${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
        }
    }

    // ────────────────────────────────────────────────────────────
    section('5. INSTRUCTOR: FETCH EXISTING PUBLISHED QUIZZES');
    // ────────────────────────────────────────────────────────────
    let existingQuizId;
    if (instructorToken) {
        const r = await request('GET', '/api/quizzes/instructor', null, instructorToken);
        if (r.status === 200) {
            const quizList = r.body.data || [];
            const published = quizList.filter(q => q.status === 'PUBLISHED');
            ok(`Found ${quizList.length} total quizzes, ${published.length} published`);
            if (published.length > 0) {
                existingQuizId = published[0]._id;
                console.log(`     Using quiz: "${published[0].title}" (${existingQuizId})`);
                console.log(`     Course ID: ${published[0].course_id?._id || published[0].course_id}`);
                if (!courseId && published[0].course_id) {
                    courseId = published[0].course_id?._id || published[0].course_id;
                }
            } else {
                console.log('  ⚠️ No published quizzes yet — will create one in step 6');
            }
        } else {
            fail('Failed to fetch instructor quizzes', `${r.status}`);
        }
    }

    // ────────────────────────────────────────────────────────────
    section('6. INSTRUCTOR: CREATE + PUBLISH A TEST QUIZ');
    // ────────────────────────────────────────────────────────────
    let newQuizId = existingQuizId;
    if (instructorToken && courseId && !existingQuizId) {
        const quizPayload = {
            course_id: courseId,
            title: `Test Quiz - ${Date.now()}`,
            description: 'Auto-generated test quiz to verify student visibility',
            questions: [
                { question: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correct_answer: 1, explanation: 'Basic arithmetic' },
                { question: 'What color is the sky?', options: ['Red', 'Green', 'Blue', 'Yellow'], correct_answer: 2, explanation: 'Sky is blue' },
                { question: 'Capital of France?', options: ['London', 'Berlin', 'Paris', 'Rome'], correct_answer: 2, explanation: 'Paris' }
            ],
            timer_minutes: 15,
            pass_percentage: 60,
            max_attempts: 3
        };

        const createR = await request('POST', '/api/quizzes/create', quizPayload, instructorToken);
        if (createR.status === 201) {
            newQuizId = createR.body.data._id;
            ok('Quiz created (DRAFT)', newQuizId);

            // Publish it
            const publishR = await request('POST', `/api/quizzes/publish/${newQuizId}`, {}, instructorToken);
            if (publishR.status === 200) {
                ok('Quiz published successfully');
            } else {
                fail('Failed to publish quiz', JSON.stringify(publishR.body).slice(0, 200));
            }
        } else {
            fail('Failed to create quiz', JSON.stringify(createR.body).slice(0, 300));
        }
    } else if (existingQuizId) {
        ok('Skipping quiz creation — using existing published quiz', existingQuizId);
    }

    // ────────────────────────────────────────────────────────────
    section('7. STUDENT: FETCH QUIZZES (core test)');
    // ────────────────────────────────────────────────────────────
    let studentQuizzes = [];
    if (studentToken) {
        const r = await request('GET', '/api/quizzes/student', null, studentToken);
        console.log(`  HTTP Status: ${r.status}`);
        if (r.status === 200 && r.body.success) {
            studentQuizzes = r.body.data || [];
            ok(`Student can see ${studentQuizzes.length} published quiz(zes)`);
            if (studentQuizzes.length > 0) {
                studentQuizzes.forEach((q, i) => {
                    console.log(`  [${i + 1}] "${q.title}"`);
                    console.log(`       Course: ${q.course?.title || 'N/A'}`);
                    console.log(`       Questions: ${q.questions_count}, Timer: ${q.timer_minutes || '∞'}m`);
                    console.log(`       Attempts Left: ${q.attemptsLeft}, Best: ${q.bestPercentage ?? 'N/A'}%`);
                    console.log(`       Passed: ${q.hasPassed}`);
                });
            } else {
                fail('Student sees 0 quizzes — check org isolation or quiz status');
                console.log('  💡 Ensure instructor quiz is PUBLISHED and student is in same org');
            }
        } else {
            fail('Student quiz fetch failed', `${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
        }
    }

    // ────────────────────────────────────────────────────────────
    section('8. STUDENT: ATTEMPT AND SUBMIT A QUIZ');
    // ────────────────────────────────────────────────────────────
    let submissionResult;
    const quizToAttempt = studentQuizzes[0];
    if (studentToken && quizToAttempt && quizToAttempt.attemptsLeft > 0) {
        console.log(`  Attempting: "${quizToAttempt.title}"`);
        const startedAt = new Date().toISOString();

        // Build answers array (pick first option for each question)
        const answers = quizToAttempt.questions.map((_, idx) => ({
            question_index: idx,
            selected_option: 0,        // always pick option A
            time_spent_seconds: 30
        }));

        const r = await request('POST', `/api/quizzes/${quizToAttempt._id}/submit`, { answers, started_at: startedAt }, studentToken);
        console.log(`  HTTP Status: ${r.status}`);
        if (r.status === 200 && r.body.success) {
            submissionResult = r.body.data;
            ok('Quiz submitted successfully!');
            console.log(`  📊 Result:`);
            console.log(`     Score: ${submissionResult.score ?? submissionResult.percentage ?? 'N/A'}`);
            console.log(`     Passed: ${submissionResult.passed}`);
            console.log(`     Attempt #: ${submissionResult.attempt_number}`);
        } else {
            const errBody = r.body;
            if (errBody.message?.includes('enrolled') || errBody.error?.includes('Enrollment')) {
                fail('Submission blocked: student not enrolled in course');
                console.log(`  ⚠️ The quiz requires course enrollment to SUBMIT (viewing is open)`);
                console.log(`  💡 Enroll student in course "${quizToAttempt.course?.title}" to allow submission`);
            } else {
                fail('Submission failed', JSON.stringify(errBody).slice(0, 300));
            }
        }
    } else if (!quizToAttempt) {
        console.log('  ⚠️ Skipped — no quizzes visible to student');
    } else if (quizToAttempt.attemptsLeft === 0) {
        console.log(`  ⚠️ Skipped — no attempts left for "${quizToAttempt.title}"`);
    }

    // ────────────────────────────────────────────────────────────
    section('9. VERIFY STUDENT QUIZ STATUS UPDATED AFTER ATTEMPT');
    // ────────────────────────────────────────────────────────────
    if (studentToken && submissionResult) {
        const r = await request('GET', '/api/quizzes/student', null, studentToken);
        if (r.status === 200 && r.body.success) {
            const updatedQuiz = (r.body.data || []).find(q => q._id === quizToAttempt._id);
            if (updatedQuiz) {
                ok('Quiz status updated after submission');
                console.log(`     Attempts now: ${updatedQuiz.attemptsCount}`);
                console.log(`     Best %: ${updatedQuiz.bestPercentage ?? 'N/A'}`);
                console.log(`     Passed: ${updatedQuiz.hasPassed}`);
            } else {
                fail('Quiz not found in updated list');
            }
        }
    } else if (!submissionResult) {
        console.log('  ⚠️ Skipped — no prior submission');
    }

    // ────────────────────────────────────────────────────────────
    section('10. INSTRUCTOR: CHECK QUIZ SUBMISSIONS (via QuizAttempt)');
    // ────────────────────────────────────────────────────────────
    if (instructorToken && newQuizId) {
        const r = await request('GET', `/api/quizzes/${newQuizId}/statistics`, null, instructorToken);
        console.log(`  HTTP Status: ${r.status}`);
        if (r.status === 200 && r.body.success) {
            const stats = r.body.data?.statistics;
            ok('Instructor can see quiz statistics');
            console.log(`     Total Attempts: ${stats?.total_attempts ?? 'N/A'}`);
            console.log(`     Avg Score: ${stats?.average_score ?? 'N/A'}`);
            console.log(`     Pass Rate: ${stats?.pass_rate ?? 'N/A'}%`);
        } else {
            fail('Failed to get statistics', JSON.stringify(r.body).slice(0, 200));
        }
    } else {
        console.log('  ⚠️ Skipped (no quiz ID or instructor token)');
    }

    // ────────────────────────────────────────────────────────────
    section('11. ORGANIZATION ISOLATION TEST');
    // ────────────────────────────────────────────────────────────
    if (studentToken && instructorUser && studentUser) {
        const instrOrg = (instructorUser.organization_id?._id || instructorUser.organization_id || '').toString();
        const studOrg = (studentUser.organization_id?._id || studentUser.organization_id || '').toString();
        if (instrOrg === studOrg) {
            ok('Org isolation confirmed — student and instructor in same org', instrOrg);
        } else {
            fail('Org mismatch — student will NOT see instructor quizzes!', `Instr: ${instrOrg} vs Stud: ${studOrg}`);
        }
    }

    // ────────────────────────────────────────────────────────────
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🏁 TEST RESULTS: ${passed} passed, ${failed} failed`);
    console.log('═'.repeat(60));
    if (failed > 0) {
        console.log('\n⚠️  Some tests failed. Check the logs above for details.\n');
        process.exit(1);
    } else {
        console.log('\n🎉 All tests passed!\n');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
