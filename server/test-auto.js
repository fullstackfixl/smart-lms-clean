/**
 * FULLY AUTOMATED - NO CONFIG NEEDED
 * Creates all test data, runs flow, reports results, cleans up
 */

const API_URL = 'http://localhost:5000';

// Auto-generated test data
const testId = Date.now().toString(36);
const TEST = {
  adminEmail: `adm_${testId}@t.com`,
  instEmail: `inst_${testId}@t.com`,
  studEmail: `stud_${testId}@t.com`,
  password: 'Test123!',
  orgName: `College_${testId}`,
  tokens: {},
  ids: {}
};

async function api(method, path, data, token) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
      body: data ? JSON.stringify(data) : null
    });
    return { status: res.status, data: await res.json().catch(() => ({})) };
  } catch (e) {
    return { status: 0, error: e.message, data: {} };
  }
}

const log = (s, m, e) => console.log(`${e ? '❌' : '✓'} [${s}] ${m}`);
const die = (s, m) => { log(s, m, true); process.exit(1); };

async function setup() {
  console.log('═'.repeat(60));
  console.log('AUTOMATED CHAIN FLOW TEST');
  console.log('═'.repeat(60));

  // 1. Platform admin login (use default or create)
  log('Setup', 'Logging in platform admin...');
  let r = await api('POST', '/api/auth/platform-admin/login', { email: 'admin@admin.com', password: 'admin123' });
  if (r.status !== 200) {
    // Try common defaults
    r = await api('POST', '/api/auth/platform-admin/login', { email: 'platform@admin.com', password: 'admin123' });
  }
  if (r.status !== 200) die('Setup', `Admin login failed: ${JSON.stringify(r.data)}`);
  TEST.tokens.admin = r.data.token || r.data.data?.token;
  log('Setup', 'Platform admin OK');

  // 2. Create college org with instructor as admin
  log('Setup', 'Creating college org...');
  r = await api('POST', '/api/platform/organizations', {
    name: TEST.orgName,
    type: 'COLLEGE',
    adminEmail: TEST.instEmail,
    modules: ['academic', 'quizzes']
  }, TEST.tokens.admin);
  if (!r.data?.data?._id) die('Setup', `Org create failed: ${JSON.stringify(r.data)}`);
  TEST.ids.org = r.data.data._id;
  TEST.tokens.orgInvite = r.data.data.inviteToken || r.data.data.token;
  log('Setup', `Org created: ${TEST.ids.org}`);

  // 3. Accept invite → becomes instructor
  log('Setup', 'Setting up instructor...');
  r = await api('POST', '/api/auth/accept-invite', {
    token: TEST.tokens.orgInvite,
    name: 'Test Instructor',
    password: TEST.password
  });
  if (!r.data?.token && !r.data?.data?.token) die('Setup', `Instructor setup failed: ${JSON.stringify(r.data)}`);
  TEST.tokens.instructor = r.data.token || r.data.data.token;
  log('Setup', 'Instructor ready');

  // 4. Create program
  r = await api('POST', '/api/admin/programs', {
    name: 'B.Tech CS', code: 'BTCS', duration: 4, durationUnit: 'years'
  }, TEST.tokens.admin);
  TEST.ids.program = r.data?.data?._id;
  if (!TEST.ids.program) die('Setup', 'Program create failed');

  // 5. Create batch
  r = await api('POST', '/api/admin/batches', {
    programId: TEST.ids.program, name: 'Batch A', code: 'A', year: 1, semester: 1
  }, TEST.tokens.admin);
  TEST.ids.batch = r.data?.data?._id;
  if (!TEST.ids.batch) die('Setup', 'Batch create failed');

  // 6. Create course
  r = await api('POST', '/api/admin/courses', {
    title: 'Data Structures', description: 'DS Course', organization_id: TEST.ids.org
  }, TEST.tokens.admin);
  TEST.ids.course = r.data?.data?._id;
  if (!TEST.ids.course) die('Setup', 'Course create failed');

  // 7. Create subject with contentCourseId
  r = await api('POST', '/api/admin/subjects', {
    organizationId: TEST.ids.org, programId: TEST.ids.program, batchId: TEST.ids.batch,
    name: 'Data Structures', code: 'CS201', semester: 1, credits: 4,
    contentCourseId: TEST.ids.course
  }, TEST.tokens.admin);
  TEST.ids.subject = r.data?.data?._id;
  if (!TEST.ids.subject) die('Setup', `Subject create failed: ${JSON.stringify(r.data)}`);
  log('Setup', `Subject: ${TEST.ids.subject}`);

  // 8. Get instructor ID and assign
  const prof = await api('GET', '/api/auth/me', null, TEST.tokens.instructor);
  TEST.ids.instructor = prof.data?.data?._id || prof.data?.data?.id || prof.data?.user?._id;
  
  r = await api('POST', '/api/admin/instructor-assignments', {
    organizationId: TEST.ids.org, programId: TEST.ids.program,
    batchId: TEST.ids.batch, subjectId: TEST.ids.subject,
    instructorId: TEST.ids.instructor, isActive: true
  }, TEST.tokens.admin);
  if (r.status !== 200 && r.status !== 201) {
    // Try alternative endpoint
    r = await api('POST', `/api/admin/subjects/${TEST.ids.subject}/assign-instructor`, {
      instructorId: TEST.ids.instructor, batchId: TEST.ids.batch
    }, TEST.tokens.admin);
  }
  log('Setup', 'Instructor assigned');

  // 9. Create and enroll student
  r = await api('POST', '/api/auth/register', {
    email: TEST.studEmail, password: TEST.password,
    full_name: 'Test Student', role: 'student', organization_id: TEST.ids.org
  });
  r = await api('POST', '/api/auth/login', { email: TEST.studEmail, password: TEST.password });
  TEST.tokens.student = r.data?.token || r.data?.data?.token;
  
  const studProf = await api('GET', '/api/auth/me', null, TEST.tokens.student);
  TEST.ids.student = studProf.data?.data?._id || studProf.data?.data?.id || studProf.data?.user?._id;

  r = await api('POST', '/api/admin/academic-enrollments', {
    organizationId: TEST.ids.org, programId: TEST.ids.program,
    batchId: TEST.ids.batch, subjectId: TEST.ids.subject,
    studentId: TEST.ids.student, instructorId: TEST.ids.instructor,
    semester: 1, year: 1
  }, TEST.tokens.admin);
  log('Setup', 'Student enrolled');
}

async function test() {
  console.log('\n' + '═'.repeat(60));
  console.log('RUNNING TESTS');
  console.log('═'.repeat(60));

  // T1: Instructor subjects
  let r = await api('GET', '/instructor/subjects', null, TEST.tokens.instructor);
  if (r.status !== 200) die('T1', `Get subjects failed: ${r.status}`);
  const subjects = r.data?.data || [];
  const found = subjects.find(s => String(s._id || s.subjectId) === TEST.ids.subject);
  if (!found) die('T1', `Subject ${TEST.ids.subject} not in list`);
  log('T1', `Instructor sees ${subjects.length} subject(s), ours is there`);

  // T2: AI Generate
  r = await api('POST', '/api/quizzes/generate-ai', {
    subjectId: TEST.ids.subject, batchId: TEST.ids.batch,
    topic: 'Arrays and Linked Lists', num_questions: 3, difficulty: 'easy'
  }, TEST.tokens.instructor);
  if (r.status === 403) die('T2', `Not authorized: ${r.data?.message}`);
  if (r.status === 400 && r.data?.message?.includes('contentCourseId')) die('T2', 'Subject missing course mapping');
  if (r.status !== 200) die('T2', `AI failed: ${r.status} - ${JSON.stringify(r.data)}`);
  const questions = r.data?.data?.questions || r.data?.questions;
  if (!questions?.length) die('T2', 'No questions returned');
  log('T2', `Generated ${questions.length} questions`);

  // T3: Create quiz
  r = await api('POST', '/api/quizzes', {
    course_id: TEST.ids.course, subjectId: TEST.ids.subject, batchId: TEST.ids.batch,
    title: 'Auto Test Quiz', description: 'Chain test',
    questions: questions.map((q, i) => ({ ...q, question: `[Q${i + 1}] ${q.question}` })),
    pass_percentage: 60, max_attempts: 3, timer_minutes: 30
  }, TEST.tokens.instructor);
  if (r.status !== 201) die('T3', `Create failed: ${r.status} - ${JSON.stringify(r.data)}`);
  TEST.ids.quiz = r.data?.data?._id || r.data?.data?.id;
  const quiz = r.data?.data;
  if (!quiz?.subjectId || !quiz?.batchId) die('T3', 'Quiz missing subjectId/batchId');
  log('T3', `Created quiz: ${TEST.ids.quiz}`);

  // T4: Publish
  r = await api('PATCH', `/api/quizzes/${TEST.ids.quiz}/publish`, null, TEST.tokens.instructor);
  if (r.status !== 200 || r.data?.data?.status !== 'PUBLISHED') die('T4', `Publish failed: ${JSON.stringify(r.data)}`);
  log('T4', 'Published');
  await new Promise(r => setTimeout(r, 1000));

  // T5: Student sees quiz
  r = await api('GET', '/api/college/student/quizzes', null, TEST.tokens.student);
  if (r.status !== 200) {
    // Try main endpoint
    r = await api('GET', '/api/quizzes?limit=100', null, TEST.tokens.student);
    if (r.status !== 200) die('T5', `Both endpoints failed: ${r.status}`);
    const quizzes = r.data?.data?.quizzes || [];
    const foundQuiz = quizzes.find(q => String(q._id || q.id) === TEST.ids.quiz);
    if (!foundQuiz) die('T5', 'Student cannot see quiz');
    log('T5', `Student sees quiz via /api/quizzes: ${foundQuiz.title?.substring(0, 30)}`);
  } else {
    const quizzes = r.data?.data || [];
    const foundQuiz = quizzes.find(q => String(q._id || q.id) === TEST.ids.quiz);
    if (!foundQuiz) die('T5', 'Student cannot see quiz in college endpoint');
    log('T5', `Student sees quiz via /api/college/student/quizzes: ${foundQuiz.title?.substring(0, 30)}`);
  }
}

async function cleanup() {
  console.log('\n' + '═'.repeat(60));
  console.log('CLEANUP');
  console.log('═'.repeat(60));
  if (TEST.ids.quiz) await api('DELETE', `/api/quizzes/${TEST.ids.quiz}`, null, TEST.tokens.instructor || TEST.tokens.admin);
  if (TEST.ids.subject) await api('DELETE', `/api/admin/subjects/${TEST.ids.subject}`, null, TEST.tokens.admin);
  if (TEST.ids.course) await api('DELETE', `/api/admin/courses/${TEST.ids.course}`, null, TEST.tokens.admin);
  if (TEST.ids.batch) await api('DELETE', `/api/admin/batches/${TEST.ids.batch}`, null, TEST.tokens.admin);
  if (TEST.ids.program) await api('DELETE', `/api/admin/programs/${TEST.ids.program}`, null, TEST.tokens.admin);
  if (TEST.ids.org) await api('DELETE', `/api/platform/organizations/${TEST.ids.org}`, null, TEST.tokens.admin);
  log('Cleanup', 'Done');
}

async function run() {
  try {
    await setup();
    await test();
    await cleanup();
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 ALL TESTS PASSED');
    console.log('═'.repeat(60));
    process.exit(0);
  } catch (e) {
    console.error('\n❌ FATAL:', e.message);
    try { await cleanup(); } catch (_) {}
    process.exit(1);
  }
}

run();
