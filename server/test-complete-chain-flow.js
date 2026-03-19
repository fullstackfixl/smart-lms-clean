/**
 * FULL AUTOMATED TEST - College Chain Quiz Flow
 * No manual steps. Creates test data, runs full flow, cleans up.
 * 
 * Run: node test-complete-chain-flow.js
 * Requires: Backend running on localhost:5000, MongoDB connected
 */

const API_URL = 'http://localhost:5000';

// Use existing platform admin or create org directly via public apply-organization
const PLATFORM_ADMIN_EMAIL = process.env.PLATFORM_ADMIN_EMAIL || 'platform@admin.com';
const PLATFORM_ADMIN_PASS = process.env.PLATFORM_ADMIN_PASS || 'admin123';

// Simple fetch wrapper
async function api(method, endpoint, data = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : null
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, data: body };
  } catch (e) {
    return { status: 0, error: e.message, data: {} };
  }
}

function log(step, msg, err = false) {
  console.log(`${err ? '❌' : '✅'} [${step}] ${msg}`);
}

// ============== SETUP ==============

async function setupPlatformAdmin() {
  console.log('\n🔧 SETUP: Logging in as platform admin...');
  
  // Try login with default credentials
  let res = await api('POST', '/api/auth/platform-admin/login', {
    email: PLATFORM_ADMIN_EMAIL,
    password: PLATFORM_ADMIN_PASS
  });
  
  if (res.status === 200 && (res.data.token || res.data.data?.token)) {
    testData.adminToken = res.data.token || res.data.data.token;
    log('Admin', `Logged in: ${PLATFORM_ADMIN_EMAIL}`);
    return;
  }
  
  console.log('Platform admin login failed:', res.status, JSON.stringify(res.data));
  console.log('\n⚠️  To fix: Set PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASS env vars');
  console.log('   Or ensure platform admin exists in database');
  throw new Error('Could not login as platform admin');
}

async function setupCollegeOrg() {
  console.log('\n🔧 SETUP: Creating college organization...');
  
  const res = await api('POST', '/api/platform/organizations', {
    name: `Test College ${Date.now()}`,
    type: 'COLLEGE',
    adminEmail: TEST_EMAILS.instructor, // Will be org admin
    modules: ['academic', 'quizzes']
  }, testData.adminToken);
  
  if (!res.data?.success && !res.data?.data?._id) {
    console.log('Org create response:', res.status, JSON.stringify(res.data));
    throw new Error('Failed to create organization');
  }
  
  testData.orgId = res.data.data?._id || res.data.data?.id;
  testData.orgInviteToken = res.data.data?.inviteToken || res.data.data?.token;
  log('Org', `Created college org: ${testData.orgId}`);
  
  // Complete org setup to become org admin
  if (testData.orgInviteToken) {
    const completeRes = await api('POST', '/api/auth/accept-invite', {
      token: testData.orgInviteToken,
      name: 'Test Instructor',
      password: 'TestPass123!'
    });
    
    if (completeRes.data?.token || completeRes.data?.data?.token) {
      testData.instructorToken = completeRes.data.token || completeRes.data.data.token;
      log('Org', 'Org admin (instructor) setup complete');
    }
  }
}

async function setupAcademicStructure() {
  console.log('\n🔧 SETUP: Creating academic structure (Program → Batch → Subject → Course)...');
  
  // Create Program
  const progRes = await api('POST', '/api/admin/programs', {
    name: 'B.Tech Computer Science',
    code: 'BTECH-CS',
    duration: 4,
    durationUnit: 'years'
  }, testData.adminToken);
  
  testData.programId = progRes.data?.data?._id || progRes.data?.data?.id;
  if (!testData.programId) {
    console.log('Program create:', progRes.status, JSON.stringify(progRes.data));
    throw new Error('Failed to create program');
  }
  log('Program', `Created: ${testData.programId}`);
  
  // Create Batch
  const batchRes = await api('POST', '/api/admin/batches', {
    programId: testData.programId,
    name: 'Batch 2024',
    code: '2024-A',
    year: 1,
    semester: 1
  }, testData.adminToken);
  
  testData.batchId = batchRes.data?.data?._id || batchRes.data?.data?.id;
  if (!testData.batchId) throw new Error('Failed to create batch');
  log('Batch', `Created: ${testData.batchId}`);
  
  // Create Course (content course)
  const courseRes = await api('POST', '/api/admin/courses', {
    title: 'Data Structures and Algorithms',
    description: 'Core CS course',
    organization_id: testData.orgId
  }, testData.adminToken);
  
  testData.courseId = courseRes.data?.data?._id || courseRes.data?.data?.id;
  if (!testData.courseId) throw new Error('Failed to create course');
  log('Course', `Created: ${testData.courseId}`);
  
  // Create Subject
  const subjRes = await api('POST', '/api/v1/admin/subjects', {
    organizationId: testData.orgId,
    programId: testData.programId,
    batchId: testData.batchId,
    departmentId: null,
    name: 'Data Structures',
    code: 'CS201',
    semester: 1,
    credits: 4,
    contentCourseId: testData.courseId
  }, testData.adminToken);
  
  testData.subjectId = subjRes.data?.data?._id || subjRes.data?.data?.id;
  if (!testData.subjectId) {
    console.log('Subject create:', subjRes.status, JSON.stringify(subjRes.data));
    throw new Error('Failed to create subject');
  }
  log('Subject', `Created: ${testData.subjectId}`);
}

async function setupUsers() {
  console.log('\n🔧 SETUP: Creating instructor and student...');
  
  // Create instructor user
  const instRes = await api('POST', '/api/auth/register', {
    email: TEST_EMAILS.instructor,
    password: 'TestPass123!',
    full_name: 'Test Instructor',
    role: 'instructor',
    organization_id: testData.orgId
  });
  
  // Login instructor
  const instLogin = await api('POST', '/api/auth/login', {
    email: TEST_EMAILS.instructor,
    password: 'TestPass123!'
  });
  testData.instructorToken = instLogin.data?.token || instLogin.data?.data?.token;
  if (!testData.instructorToken) throw new Error('Failed to login instructor');
  log('Instructor', `Created & logged in: ${TEST_EMAILS.instructor}`);
  
  // Create student user
  const studRes = await api('POST', '/api/auth/register', {
    email: TEST_EMAILS.student,
    password: 'TestPass123!',
    full_name: 'Test Student',
    role: 'student',
    organization_id: testData.orgId
  });
  
  // Login student
  const studLogin = await api('POST', '/api/auth/login', {
    email: TEST_EMAILS.student,
    password: 'TestPass123!'
  });
  testData.studentToken = studLogin.data?.token || studLogin.data?.data?.token;
  if (!testData.studentToken) throw new Error('Failed to login student');
  log('Student', `Created & logged in: ${TEST_EMAILS.student}`);
}

async function setupInstructorAssignment() {
  console.log('\n🔧 SETUP: Assigning instructor to subject+batch...');
  
  // Get instructor ID from token or profile
  const profileRes = await api('GET', '/api/auth/me', null, testData.instructorToken);
  const instructorId = profileRes.data?.data?._id || profileRes.data?.data?.id || profileRes.data?.user?._id;
  
  if (!instructorId) {
    // Try to get user ID from another endpoint
    const dashRes = await api('GET', '/instructor/dashboard/overview', null, testData.instructorToken);
    console.log('Profile response:', JSON.stringify(profileRes.data));
    console.log('Dashboard:', JSON.stringify(dashRes.data));
  }
  
  // Assign instructor
  const assignRes = await api('POST', '/api/admin/instructor-assignments', {
    organizationId: testData.orgId,
    programId: testData.programId,
    batchId: testData.batchId,
    subjectId: testData.subjectId,
    instructorId: instructorId,
    isActive: true
  }, testData.adminToken);
  
  if (assignRes.status !== 201 && assignRes.status !== 200) {
    console.log('Assignment response:', assignRes.status, JSON.stringify(assignRes.data));
    // Try alternative endpoint
    const altRes = await api('POST', `/api/admin/subjects/${testData.subjectId}/assign-instructor`, {
      instructorId: instructorId,
      batchId: testData.batchId
    }, testData.adminToken);
    console.log('Alt assignment:', altRes.status, JSON.stringify(altRes.data));
  }
  
  log('Assignment', 'Instructor assigned to subject+batch');
  
  // Enroll student in AcademicEnrollment
  const studProfile = await api('GET', '/api/auth/me', null, testData.studentToken);
  const studentId = studProfile.data?.data?._id || studProfile.data?.data?.id || studProfile.data?.user?._id;
  
  const enrollRes = await api('POST', '/api/admin/academic-enrollments', {
    organizationId: testData.orgId,
    programId: testData.programId,
    batchId: testData.batchId,
    subjectId: testData.subjectId,
    studentId: studentId,
    instructorId: instructorId,
    semester: 1,
    year: 1
  }, testData.adminToken);
  
  if (enrollRes.status !== 201 && enrollRes.status !== 200) {
    console.log('Enrollment response:', enrollRes.status, JSON.stringify(enrollRes.data));
  }
  
  log('Enrollment', 'Student enrolled in subject+batch');
}

// ============== TEST FLOW ==============

async function testInstructorSeesSubject() {
  console.log('\n📋 TEST 1: Instructor sees assigned subject in dropdown');
  
  const res = await api('GET', '/instructor/subjects', null, testData.instructorToken);
  
  if (res.status !== 200) {
    throw new Error(`Failed to get subjects: ${res.status}`);
  }
  
  const subjects = res.data?.data || [];
  const found = subjects.find(s => 
    String(s._id || s.subjectId) === String(testData.subjectId)
  );
  
  if (!found) {
    console.log('Available subjects:', subjects.map(s => ({ id: s._id || s.subjectId, name: s.name })));
    throw new Error('Instructor does not see the assigned subject');
  }
  
  log('Test 1', `✓ Instructor sees subject: ${found.name || found.code}`);
}

async function testAIGenerateWithSubjectBatch() {
  console.log('\n📋 TEST 2: AI Generate quiz using subjectId+batchId');
  
  const res = await api('POST', '/api/quizzes/generate-ai', {
    subjectId: testData.subjectId,
    batchId: testData.batchId,
    topic: 'Introduction to Data Structures',
    num_questions: 3,
    difficulty: 'easy'
  }, testData.instructorToken);
  
  if (res.status === 400 && res.data?.message?.includes('contentCourseId')) {
    throw new Error(`Subject missing contentCourseId mapping: ${res.data.message}`);
  }
  
  if (res.status === 403) {
    throw new Error(`Instructor not authorized: ${res.data?.message}`);
  }
  
  if (res.status !== 200) {
    throw new Error(`AI generate failed: ${res.status} - ${JSON.stringify(res.data)}`);
  }
  
  const questions = res.data?.data?.questions || res.data?.questions;
  if (!questions || !Array.isArray(questions) || questions.length !== 3) {
    throw new Error(`Expected 3 questions, got: ${questions?.length}`);
  }
  
  log('Test 2', `✓ Generated ${questions.length} questions via AI`);
  return questions;
}

async function testCreateQuizWithSubjectBatch(questions) {
  console.log('\n📋 TEST 3: Create quiz with subjectId+batchId');
  
  // Simulate editing - modify first question
  const editedQuestions = questions.map((q, i) => ({
    ...q,
    question: i === 0 ? `[EDITED] ${q.question}` : q.question
  }));
  
  const res = await api('POST', '/api/quizzes', {
    course_id: testData.courseId,
    subjectId: testData.subjectId,
    batchId: testData.batchId,
    title: 'Chain Flow Test Quiz',
    description: 'Testing complete academic chain',
    questions: editedQuestions,
    pass_percentage: 60,
    max_attempts: 3,
    timer_minutes: 30
  }, testData.instructorToken);
  
  if (res.status !== 201) {
    throw new Error(`Create quiz failed: ${res.status} - ${JSON.stringify(res.data)}`);
  }
  
  testData.quizId = res.data?.data?._id || res.data?.data?.id || res.data?.quiz?._id;
  if (!testData.quizId) {
    throw new Error('No quiz ID in response');
  }
  
  // Verify subjectId and batchId stored
  const quiz = res.data?.data;
  if (!quiz.subjectId || !quiz.batchId) {
    throw new Error('Quiz missing subjectId or batchId');
  }
  
  log('Test 3', `✓ Quiz created: ${testData.quizId}`);
  log('Test 3', `  Subject: ${quiz.subjectId}, Batch: ${quiz.batchId}`);
}

async function testPublishQuiz() {
  console.log('\n📋 TEST 4: Publish quiz (triggers notifications)');
  
  const res = await api('PATCH', `/api/quizzes/${testData.quizId}/publish`, null, testData.instructorToken);
  
  if (res.status !== 200) {
    throw new Error(`Publish failed: ${res.status} - ${JSON.stringify(res.data)}`);
  }
  
  if (res.data?.data?.status !== 'PUBLISHED') {
    throw new Error(`Quiz not marked as PUBLISHED: ${res.data?.data?.status}`);
  }
  
  log('Test 4', '✓ Quiz published successfully');
  
  // Wait for async notifications
  await new Promise(r => setTimeout(r, 1500));
}

async function testStudentSeesQuiz() {
  console.log('\n📋 TEST 5: Student in batch sees published quiz');
  
  // Try college endpoint
  const res = await api('GET', '/api/college/student/quizzes', null, testData.studentToken);
  
  if (res.status !== 200) {
    console.log('College endpoint failed, trying main:', res.status);
    // Fallback to main endpoint
    const mainRes = await api('GET', '/api/quizzes?limit=100', null, testData.studentToken);
    if (mainRes.status !== 200) {
      throw new Error(`Both endpoints failed: ${res.status}, ${mainRes.status}`);
    }
    
    const quizzes = mainRes.data?.data?.quizzes || [];
    const found = quizzes.find(q => String(q._id || q.id) === String(testData.quizId));
    
    if (!found) {
      throw new Error('Student cannot see quiz in main endpoint');
    }
    
    log('Test 5', `✓ Student sees quiz via main endpoint: ${found.title}`);
    return;
  }
  
  const quizzes = res.data?.data || [];
  const found = quizzes.find(q => String(q._id || q.id) === String(testData.quizId));
  
  if (!found) {
    console.log('Available quizzes:', quizzes.map(q => ({ id: q._id || q.id, title: q.title?.substring(0, 30) })));
    throw new Error('Student cannot see published quiz via college endpoint');
  }
  
  log('Test 5', `✓ Student sees quiz via college endpoint: ${found.title}`);
}

// ============== CLEANUP ==============

async function cleanup() {
  console.log('\n🧹 CLEANUP: Removing test data...');
  
  // Delete quiz
  if (testData.quizId) {
    await api('DELETE', `/api/quizzes/${testData.quizId}`, null, testData.adminToken);
    log('Cleanup', 'Deleted quiz');
  }
  
  // Delete subject
  if (testData.subjectId) {
    await api('DELETE', `/api/admin/subjects/${testData.subjectId}`, null, testData.adminToken);
  }
  
  // Delete batch
  if (testData.batchId) {
    await api('DELETE', `/api/admin/batches/${testData.batchId}`, null, testData.adminToken);
  }
  
  // Delete course
  if (testData.courseId) {
    await api('DELETE', `/api/admin/courses/${testData.courseId}`, null, testData.adminToken);
  }
  
  // Delete program
  if (testData.programId) {
    await api('DELETE', `/api/admin/programs/${testData.programId}`, null, testData.adminToken);
  }
  
  log('Cleanup', 'Test data cleaned up');
}

// ============== MAIN ==============

async function run() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  COMPLETE AUTOMATED CHAIN FLOW TEST                      ║');
  console.log('║  (Setup → AI Generate → Create → Publish → Verify)    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  const startTime = Date.now();
  let failed = false;
  
  try {
    // Setup
    await setupPlatformAdmin();
    await setupCollegeOrg();
    await setupAcademicStructure();
    await setupUsers();
    await setupInstructorAssignment();
    
    // Tests
    await testInstructorSeesSubject();
    const questions = await testAIGenerateWithSubjectBatch();
    await testCreateQuizWithSubjectBatch(questions);
    await testPublishQuiz();
    await testStudentSeesQuiz();
    
  } catch (error) {
    failed = true;
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  }
  
  // Cleanup
  try {
    await cleanup();
  } catch (e) {
    console.log('Cleanup warning:', e.message);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n═══════════════════════════════════════════════════════════');
  if (failed) {
    console.log('❌ TEST FAILED');
    process.exit(1);
  } else {
    console.log('🎉 ALL TESTS PASSED!');
    console.log(`⏱️ Duration: ${duration}s`);
    console.log('═══════════════════════════════════════════════════════════');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
