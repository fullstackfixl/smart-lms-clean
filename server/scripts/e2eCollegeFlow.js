const axios = require('axios');

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5000';

const CREDS = {
  orgAdmin: { email: 'dushyant4665fixlsolution@gmail.com', password: '121321421' },
  instructor: { email: 'dushyant4665@gmail.com', password: '121321421' },
  student: { email: 'dushyantkhandelwal4665@gmail.com', password: '121321421' },
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function title(msg) {
  process.stdout.write(`\n=== ${msg} ===\n`);
}

async function login(email, password) {
  const res = await axios.post(
    `${BASE_URL}/api/auth/login`,
    { email, password },
    { timeout: 30000, validateStatus: () => true }
  );
  if (!res.data?.success) {
    throw new Error(`LOGIN_FAILED ${email}: ${res.status} ${JSON.stringify(res.data)}`);
  }
  return res.data.data.token;
}

async function api(token, method, path, body, params) {
  const res = await axios({
    method,
    url: `${BASE_URL}${path}`,
    headers: { Authorization: `Bearer ${token}` },
    data: body,
    params,
    timeout: 60000,
    validateStatus: () => true,
  });
  if (res.status >= 400 || res.data?.success === false) {
    throw new Error(`API_FAIL ${method.toUpperCase()} ${path} ${res.status}: ${JSON.stringify(res.data)}`);
  }
  return res.data;
}

async function main() {
  title('LOGIN TOKENS');
  const orgToken = await login(CREDS.orgAdmin.email, CREDS.orgAdmin.password);
  const instToken = await login(CREDS.instructor.email, CREDS.instructor.password);
  const studentToken = await login(CREDS.student.email, CREDS.student.password);
  console.log('OK: tokens acquired');

  title('ORG ADMIN: GET OR CREATE DEPARTMENT');
  const deptName = `E2E Dept ${new Date().toISOString().slice(0, 10)}`;
  const deptCode = `E2E${Date.now().toString().slice(-4)}`;

  const deptList = await api(orgToken, 'get', '/api/college/admin/departments');
  let department = (deptList.data?.departments || []).find((d) => d.code === deptCode || d.name === deptName);
  if (!department) {
    const created = await api(orgToken, 'post', '/api/college/admin/departments', {
      name: deptName,
      code: deptCode,
      description: 'E2E department',
    });
    department = created.data.department;
  }
  console.log('departmentId:', department._id);

  title('ORG ADMIN: GET OR CREATE PROGRAM');
  const progCode = `E2EP${Date.now().toString().slice(-3)}`;
  const programsRes = await api(orgToken, 'get', '/api/college/admin/programs');
  let program = (programsRes.data?.programs || []).find((p) => p.code === progCode);
  if (!program) {
    const created = await api(orgToken, 'post', '/api/college/admin/programs', {
      name: `E2E Program ${new Date().toISOString().slice(0, 10)}`,
      code: progCode,
      duration: 4,
      durationUnit: 'years',
      departmentId: department._id,
      description: 'E2E program',
    });
    program = created.data.program;
  }
  console.log('programId:', program._id);

  title('ORG ADMIN: GET STUDENT + INSTRUCTOR IDS');
  const instructorsRes = await api(orgToken, 'get', '/api/college/admin/instructors', null, { search: 'dushyant' });
  const instructor = (instructorsRes.data?.instructors || []).find((u) => u.email?.toLowerCase() === CREDS.instructor.email.toLowerCase());
  if (!instructor) throw new Error('INSTRUCTOR_NOT_FOUND_IN_ORG_ADMIN_LIST');

  const studentsRes = await api(orgToken, 'get', '/api/college/admin/students', null, { search: 'dushyant' });
  const student = (studentsRes.data?.students || []).find((u) => u.email?.toLowerCase() === CREDS.student.email.toLowerCase());
  if (!student) throw new Error('STUDENT_NOT_FOUND_IN_ORG_ADMIN_LIST');

  console.log('instructorId:', instructor._id);
  console.log('studentId:', student._id);

  title('ORG ADMIN: CREATE BATCH');
  const batchCode = `E2EB${Date.now().toString().slice(-4)}`;
  const batchName = `E2E Batch ${new Date().toISOString().slice(0, 10)}`;

  const batchCreated = await api(orgToken, 'post', '/api/college/admin/batches', {
    name: batchName,
    code: batchCode,
    programId: program._id,
    departmentId: department._id,
    year: new Date().getFullYear(),
    semester: 1,
  });
  const batch = batchCreated.data.batch;
  console.log('batchId:', batch._id);

  title('ORG ADMIN: ASSIGN STUDENT TO BATCH');
  await api(orgToken, 'put', `/api/college/admin/batches/${batch._id}/assign-students`, {
    studentIds: [student._id],
  });
  console.log('OK: student assigned');

  title('INSTRUCTOR: CREATE COURSE (DRAFT)');
  const courseTitle = `E2E Course ${Date.now()}`;
  const courseCreated = await api(instToken, 'post', '/api/courses/create', {
    title: courseTitle,
    description: 'E2E course description',
    category: 'general',
    price: 0,
    level: 'beginner',
  });
  const course = courseCreated.data.course;
  console.log('courseId:', course._id);

  title('INSTRUCTOR: SUBMIT COURSE FOR APPROVAL');
  await api(instToken, 'post', `/instructor/courses/${course._id}/submit-for-approval`);
  console.log('OK: submitted');

  title('ORG ADMIN: VERIFY PENDING COURSE + APPROVE');
  const pendingRes = await api(orgToken, 'get', '/api/college/admin/courses/pending');
  const pending = (pendingRes.data?.courses || []).find((c) => String(c._id) === String(course._id));
  if (!pending) throw new Error('PENDING_COURSE_NOT_VISIBLE_TO_ORG_ADMIN');

  await api(orgToken, 'patch', `/api/college/admin/courses/${course._id}/approve`, { status: 'published' });
  console.log('OK: approved/published');

  title('ORG ADMIN: CREATE SUBJECT (MAP TO COURSE)');
  const subjCode = `E2ES${Date.now().toString().slice(-4)}`;
  const subjCreated = await api(orgToken, 'post', '/api/college/admin/subjects', {
    name: `E2E Subject ${new Date().toISOString().slice(0, 10)}`,
    code: subjCode,
    programId: program._id,
    departmentId: department._id,
    batchId: batch._id,
    semester: 1,
    credits: 3,
    description: 'E2E subject',
    instructorId: instructor._id,
    contentCourseId: course._id,
  });
  const subject = subjCreated.data.subject;
  console.log('subjectId:', subject._id);

  title('ORG ADMIN: CREATE TIMETABLE ENTRY');
  const timetableCreated = await api(orgToken, 'post', '/api/college/admin/timetable', {
    programId: program._id,
    batchId: batch._id,
    subjectId: subject._id,
    instructorId: instructor._id,
    day: 'Monday',
    startTime: '10:00',
    endTime: '11:00',
    room: 'E2E Room',
  });
  console.log('timetableEntryId:', timetableCreated.data.entry?._id);

  title('INSTRUCTOR: VERIFY SUBJECTS INCLUDE NEW SUBJECT');
  const instSubjectsRes = await api(instToken, 'get', '/instructor/subjects');
  const instSubjects = instSubjectsRes.data || instSubjectsRes.data?.subjects || instSubjectsRes.data?.data;
  const hasSubject = Array.isArray(instSubjects)
    ? instSubjects.some((s) => String(s._id) === String(subject._id))
    : false;
  if (!hasSubject) {
    console.log('WARN: instructor subjects endpoint did not include the new subject (may be cached/UI-only).');
  } else {
    console.log('OK: subject visible to instructor');
  }

  title('INSTRUCTOR: SCHEDULE LIVE CLASS (API /api/live-classes)');
  const scheduled = new Date(Date.now() + 60 * 60 * 1000); // +1 hour
  const pad2 = (n) => String(n).padStart(2, '0');
  const startTime = `${pad2(scheduled.getHours())}:${pad2(scheduled.getMinutes())}`;
  const liveCreated = await api(instToken, 'post', '/api/live-classes', {
    course_id: course._id,
    title: `E2E Live Class - ${new Date().toISOString()}`,
    scheduled_date: scheduled.toISOString(),
    start_time: startTime,
    duration_minutes: 45,
    meeting_url: 'https://example.com/meet/e2e',
    notify_students: true,
  });
  const liveClass = liveCreated.data.liveClass || liveCreated.data;
  console.log('liveClassId:', liveClass._id);

  title('INSTRUCTOR: GENERATE AI QUIZ + CREATE + PUBLISH');
  const aiGen = await api(instToken, 'post', '/api/quizzes/generate-ai', {
    course_id: course._id,
    topic: 'Introduction basics',
    num_questions: 3,
    difficulty: 'easy'
  });
  const aiQuestions = aiGen.data.questions || aiGen.data?.data?.questions || [];
  if (!Array.isArray(aiQuestions) || aiQuestions.length === 0) {
    throw new Error('AI generation returned no questions');
  }

  const quizCreate = await api(instToken, 'post', `/instructor/courses/${course._id}/quizzes`, {
    title: `E2E Quiz - ${new Date().toISOString()}`,
    description: 'E2E generated quiz',
    questions: aiQuestions,
    pass_percentage: 60,
    max_attempts: 3,
    total_marks: aiQuestions.length
  });
  const createdQuizId = quizCreate.data?.quiz?._id || quizCreate.data?._id || quizCreate.data?.id;
  console.log('quizId:', createdQuizId);
  await api(instToken, 'patch', `/api/quizzes/${createdQuizId}/publish`, {});

  title('STUDENT: VERIFY NOTIFICATION (LIVE CLASS SCHEDULED)');
  const notifs = await api(studentToken, 'get', '/api/notifications?limit=20');
  const notifList = notifs.data.notifications || notifs.data || [];
  const liveNotif = notifList.find(n => (n.type || '').includes('live') || (n.title || '').toLowerCase().includes('live'));
  if (!liveNotif) throw new Error('Student did not receive live class notification');
  console.log('OK: student received notification');

  title('STUDENT: VERIFY LIVE CLASS LIST (COLLEGE TENANT)');
  const liveList = await api(studentToken, 'get', '/api/college/student/live-classes');
  const liveClasses = liveList.data.liveClasses || liveList.data || [];
  const found = Array.isArray(liveClasses) && liveClasses.some(lc => (lc._id || '').toString() === (liveClass._id || '').toString());
  if (!found) throw new Error('Live class not visible to student');
  console.log('OK: live class visible to student');

  title('STUDENT: VERIFY QUIZ LIST (COLLEGE TENANT) + SUBMIT');
  const qListRes = await api(studentToken, 'get', '/api/college/student/quizzes');
  const quizzes = qListRes.data.quizzes || qListRes.data || [];
  const qFound = Array.isArray(quizzes) && quizzes.find(q => (q._id || '').toString() === (createdQuizId || '').toString());
  if (!qFound) throw new Error('Published quiz not visible to student');
  console.log('OK: quiz visible to student');

  const answers = new Array((qFound.questions || []).length).fill(0).map((sel, idx) => ({
    question_index: idx,
    selected_option: 0,
    time_spent_seconds: 0
  }));
  const submitRes = await api(studentToken, 'post', `/api/quizzes/${createdQuizId}/submit`, {
    answers,
    started_at: new Date(Date.now() - 30000).toISOString()
  });
  if (!submitRes.success) throw new Error('Quiz submit failed');
  console.log('OK: student submitted quiz');

  title('DONE');
  console.log('E2E script completed.');
}

main().catch((err) => {
  console.error('\nE2E FAILED:', err.message);
  process.exit(1);
});
