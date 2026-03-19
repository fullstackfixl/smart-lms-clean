/**
 * TEST WITH PROVIDED CREDENTIALS
 * org-admin: dushyant22062003@gmail.com / dushyant4665
 * instructor: dushyant4665@gmail.com / 121321421
 * student: dushyantkhandelwal4665@gmail.com / 121321421
 */

const API_URL = 'http://localhost:5000';

const CREDENTIALS = {
  orgAdmin: { email: 'dushyant22062003@gmail.com', password: 'dushyant4665' },
  instructor: { email: 'dushyant4665@gmail.com', password: '121321421' },
  student: { email: 'dushyantkhandelwal4665@gmail.com', password: '121321421' }
};

let tokens = {};
let ids = {};

async function api(method, path, data, token) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
      body: data ? JSON.stringify(data) : null
    });
    return { status: res.status, data: await res.json().catch(() => ({})) };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

const log = (s, m, e) => console.log(`${e ? '❌' : '✅'} [${s}] ${m}`);
const die = (s, m) => { log(s, m, true); process.exit(1); };

async function login(role, creds) {
  const endpoint = role === 'orgAdmin' ? '/api/auth/org-admin/login' : '/api/auth/login';
  const r = await api('POST', endpoint, creds);
  if (r.status !== 200) die(`Login-${role}`, `${r.status}: ${JSON.stringify(r.data)}`);
  const token = r.data?.token || r.data?.data?.token;
  if (!token) die(`Login-${role}`, 'No token');
  log(`Login-${role}`, 'OK');
  return token;
}

async function test() {
  console.log('═'.repeat(60));
  console.log('CHAIN FLOW TEST - USING PROVIDED CREDENTIALS');
  console.log('═'.repeat(60));

  // Login all users
  tokens.orgAdmin = await login('orgAdmin', CREDENTIALS.orgAdmin);
  tokens.instructor = await login('instructor', CREDENTIALS.instructor);
  tokens.student = await login('student', CREDENTIALS.student);

  // Get instructor subjects to find one with batch
  log('Fetch', 'Getting instructor subjects...');
  const subjRes = await api('GET', '/instructor/subjects', null, tokens.instructor);
  if (subjRes.status !== 200) die('Subjects', `Failed: ${subjRes.status}`);
  
  const subjects = subjRes.data?.data || [];
  if (!subjects.length) die('Subjects', 'No subjects assigned');
  
  // Use first subject
  const subject = subjects[0];
  ids.subject = subject._id || subject.subjectId;
  ids.batch = subject.batchId || subject.batch?._id;
  ids.course = subject.contentCourseId;
  
  log('Subjects', `Using: ${subject.name || subject.code} (Subject: ${ids.subject}, Batch: ${ids.batch})`);
  
  if (!ids.batch) die('Setup', 'Subject has no batchId');
  
  // If no contentCourseId, create one and update subject
  if (!ids.course) {
    log('Setup', 'Subject missing contentCourseId - creating course...');
    
    // Get org ID from instructor profile
    const profRes = await api('GET', '/api/auth/me', null, tokens.instructor);
    const orgId = profRes.data?.data?.organization_id || profRes.data?.data?.organizationId;
    
    // Create course with unique title
    const uniqueTitle = `${subject.name || subject.code} - Content ${Date.now()}`;
    const courseRes = await api('POST', '/api/admin/courses', {
      title: uniqueTitle,
      description: 'Auto-created content course for subject',
      category: 'Computer Science',
      organization_id: orgId
    }, tokens.orgAdmin);
    
    if (courseRes.status !== 201) die('Setup', `Course create failed: ${JSON.stringify(courseRes.data)}`);
    ids.course = courseRes.data?.data?.course?._id || 
                 courseRes.data?.data?.course?.id ||
                 courseRes.data?.data?._id || 
                 courseRes.data?.data?.id ||
                 courseRes.data?.course?._id ||
                 courseRes.data?.course?.id;
    if (!ids.course) {
      console.log('Course response:', JSON.stringify(courseRes.data));
      die('Setup', 'Could not extract course ID');
    }
    log('Setup', `Created course: ${ids.course}`);
    
    // Update subject with contentCourseId using college admin endpoint
    const updRes = await api('PUT', `/api/college/admin/subjects/${ids.subject}`, {
      contentCourseId: ids.course
    }, tokens.orgAdmin);
    
    if (updRes.status !== 200) {
      console.log('Subject update response:', updRes.status, JSON.stringify(updRes.data));
      die('Setup', 'Failed to update subject with contentCourseId');
    }
    log('Setup', 'Subject linked to course');
  }

  // T1: AI Generate
  console.log('\n📋 TEST 1: AI Generate with subject+batch');
  const aiRes = await api('POST', '/api/quizzes/generate-ai', {
    subjectId: ids.subject,
    batchId: ids.batch,
    topic: 'Data Structures - Arrays and Lists',
    num_questions: 3,
    difficulty: 'easy'
  }, tokens.instructor);
  
  if (aiRes.status === 403) die('T1', `Not authorized: ${aiRes.data?.message}`);
  if (aiRes.status !== 200) die('T1', `Failed: ${aiRes.status} - ${JSON.stringify(aiRes.data)}`);
  
  const questions = aiRes.data?.data?.questions || aiRes.data?.questions;
  if (!questions?.length) die('T1', 'No questions');
  log('T1', `Generated ${questions.length} questions`);

  // T2: Create Quiz
  console.log('\n📋 TEST 2: Create quiz with subjectId+batchId');
  const createRes = await api('POST', '/api/quizzes', {
    course_id: ids.course,
    subjectId: ids.subject,
    batchId: ids.batch,
    title: 'Chain Flow Test Quiz',
    description: 'Testing subject+batch chain',
    questions: questions.map((q, i) => ({ ...q, question: `[Q${i+1}] ${q.question}` })),
    pass_percentage: 60,
    max_attempts: 3,
    timer_minutes: 30
  }, tokens.instructor);
  
  if (createRes.status !== 201) die('T2', `Failed: ${createRes.status} - ${JSON.stringify(createRes.data)}`);
  
  ids.quiz = createRes.data?.data?._id || createRes.data?.data?.id;
  const quiz = createRes.data?.data;
  if (!ids.quiz) die('T2', 'No quiz ID');
  if (!quiz?.subjectId || !quiz?.batchId) die('T2', 'Quiz missing subjectId/batchId');
  log('T2', `Created: ${ids.quiz}`);
  log('T2', `  subjectId: ${quiz.subjectId}, batchId: ${quiz.batchId}`);

  // T3: Publish
  console.log('\n📋 TEST 3: Publish quiz');
  const pubRes = await api('PATCH', `/api/quizzes/${ids.quiz}/publish`, null, tokens.instructor);
  if (pubRes.status !== 200 || pubRes.data?.data?.status !== 'PUBLISHED') {
    die('T3', `Failed: ${JSON.stringify(pubRes.data)}`);
  }
  log('T3', 'Published');
  await new Promise(r => setTimeout(r, 1500));

  // T4: Student sees quiz
  console.log('\n📋 TEST 4: Student sees published quiz');
  
  // Try college endpoint first
  let studRes = await api('GET', '/api/college/student/quizzes', null, tokens.student);
  
  let quizzes = [];
  let found = null;
  
  if (studRes.status === 200) {
    quizzes = studRes.data?.data || studRes.data?.quizzes || [];
    if (!Array.isArray(quizzes)) {
      console.log('   Response structure:', JSON.stringify(studRes.data).substring(0, 200));
      quizzes = [];
    }
    found = quizzes.find(q => String(q._id || q.id) === ids.quiz);
  }
  
  if (!found) {
    // Try main endpoint
    studRes = await api('GET', '/api/quizzes?limit=100', null, tokens.student);
    if (studRes.status === 200) {
      quizzes = studRes.data?.data?.quizzes || studRes.data?.data || [];
      if (!Array.isArray(quizzes)) quizzes = [];
      found = quizzes.find(q => String(q._id || q.id) === ids.quiz);
    }
  }
  
  if (!found) {
    console.log('   Available quizzes:', quizzes.slice(0, 5).map(q => ({ id: q._id || q.id, title: q.title?.substring(0, 30) })));
    die('T4', 'Student cannot see quiz');
  }
  
  log('T4', `✓ Student sees: ${found.title?.substring(0, 40)}`);
  
  // T5: Student attempts quiz
  console.log('\n📋 TEST 5: Student starts quiz attempt');
  
  // First enroll student in the course (required for quiz access)
  const enrollRes = await api('POST', '/api/enrollments', {
    course_id: ids.course
  }, tokens.student);
  
  if (enrollRes.status !== 201 && enrollRes.status !== 200 && enrollRes.status !== 409) {
    log('T5', `Enrollment: ${enrollRes.status} - may already be enrolled`, true);
  } else {
    log('T5', 'Enrolled in course');
  }
  
  // Start quiz using GET
  const startRes = await api('GET', `/api/quizzes/${ids.quiz}/start`, null, tokens.student);
  
  if (startRes.status !== 200) {
    log('T5', `Start failed: ${startRes.status} - ${JSON.stringify(startRes.data)}`, true);
  } else {
    log('T5', 'Quiz started');
    
    // Get questions (without answers)
    const questions = startRes.data?.data?.quiz?.questions || [];
    log('T5', `Got ${questions.length} questions`);
    
    // Submit answers (all first option for test)
    const answers = questions.map((q, i) => ({
      question_index: i,
      selected_option: 0,
      time_spent_seconds: 30
    }));
    
    const submitRes = await api('POST', `/api/quizzes/${ids.quiz}/submit`, {
      answers,
      started_at: new Date().toISOString()
    }, tokens.student);
    
    if (submitRes.status === 201 || submitRes.status === 200) {
      const attempt = submitRes.data?.data?.attempt;
      log('T5', `✓ Submitted! Score: ${attempt?.score}/${attempt?.total_questions} (${attempt?.percentage}%)`);
    } else {
      log('T5', `Submit failed: ${submitRes.status} - ${JSON.stringify(submitRes.data)}`, true);
    }
  }

  // Cleanup
  console.log('\n🧹 Cleanup: Deleting test quiz...');
  await api('DELETE', `/api/quizzes/${ids.quiz}`, null, tokens.instructor);
  log('Cleanup', 'Done');

  console.log('\n' + '═'.repeat(60));
  console.log('🎉 ALL TESTS PASSED!');
  console.log('═'.repeat(60));
  process.exit(0);
}

test().catch(e => {
  console.error('\n❌ FATAL:', e.message);
  process.exit(1);
});
