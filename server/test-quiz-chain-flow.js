/**
 * End-to-end test for College Chain Quiz Flow
 * Tests: Instructor Subject+Batch → AI Generate → Edit → Publish → Student Sees
 * 
 * Run with: node test-quiz-chain-flow.js
 * Requires: A running backend server on http://localhost:5000
 * Node 18+ (has native fetch)
 * 
 * Set these env vars or edit the constants below:
 * - TEST_INSTRUCTOR_TOKEN (JWT for instructor)
 * - TEST_STUDENT_TOKEN (JWT for student in the batch)
 * - TEST_SUBJECT_ID
 * - TEST_BATCH_ID
 */

const API_URL = process.env.API_URL || 'http://localhost:5000';
const INSTRUCTOR_TOKEN = process.env.TEST_INSTRUCTOR_TOKEN || 'YOUR_INSTRUCTOR_JWT_HERE';
const STUDENT_TOKEN = process.env.TEST_STUDENT_TOKEN || 'YOUR_STUDENT_JWT_HERE';

// Academic chain IDs - must exist in your database
const TEST_SUBJECT_ID = process.env.TEST_SUBJECT_ID || 'YOUR_SUBJECT_ID';
const TEST_BATCH_ID = process.env.TEST_BATCH_ID || 'YOUR_BATCH_ID';
const TEST_TOPIC = 'Introduction to Data Structures';

// ==================== TEST STATE ====================
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

let generatedQuestions = null;
let createdQuizId = null;

// ==================== HELPERS ====================
function log(section, message, isError = false) {
  const prefix = isError ? '❌' : '✅';
  const color = isError ? '\x1b[31m' : '\x1b[32m';
  const reset = '\x1b[0m';
  console.log(`${color}${prefix} [${section}]${reset} ${message}`);
}

async function apiRequest(method, endpoint, data = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : null
    });
    const responseData = await response.json().catch(() => ({}));
    return { status: response.status, data: responseData };
  } catch (error) {
    return { status: 500, data: { success: false, error: error.message } };
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// ==================== TEST STEPS ====================

async function test1_InstructorCanGetSubjects() {
  console.log('\n📋 TEST 1: Instructor can list their assigned subjects');
  
  const res = await apiRequest('GET', '/instructor/subjects', null, INSTRUCTOR_TOKEN);
  
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(res.data.success === true, 'Response should have success: true');
  assert(Array.isArray(res.data.data), 'Response data should be an array');
  
  // Check if our test subject is in the list
  const hasSubject = res.data.data.some(s => 
    String(s._id) === String(TEST_SUBJECT_ID) || 
    String(s.subjectId) === String(TEST_SUBJECT_ID)
  );
  
  if (!hasSubject && res.data.data.length > 0) {
    console.log(`   ℹ️  Found ${res.data.data.length} subjects. First subject ID: ${res.data.data[0]._id || res.data.data[0].subjectId}`);
    console.log(`   ℹ️  Looking for: ${TEST_SUBJECT_ID}`);
  }
  
  log('Test 1', `Instructor has ${res.data.data.length} subject(s) assigned`);
  return res.data.data;
}

async function test2_AIGenerateQuizWithSubjectBatch() {
  console.log('\n📋 TEST 2: AI Generate quiz with subjectId + batchId');
  
  const payload = {
    subjectId: TEST_SUBJECT_ID,
    batchId: TEST_BATCH_ID,
    topic: TEST_TOPIC,
    num_questions: 3,
    difficulty: 'medium'
  };
  
  const res = await apiRequest('POST', '/api/quizzes/generate-ai', payload, INSTRUCTOR_TOKEN);
  
  if (res.status === 403) {
    throw new Error(`Instructor not assigned to this subject+batch. Status: ${res.status}, Message: ${res.data?.message}`);
  }
  
  assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
  assert(res.data.success === true, 'Response should have success: true');
  assert(res.data.data?.questions, 'Response should have data.questions');
  assert(Array.isArray(res.data.data.questions), 'Questions should be an array');
  assert(res.data.data.questions.length === 3, `Expected 3 questions, got ${res.data.data.questions.length}`);
  
  // Validate question format
  const q = res.data.data.questions[0];
  assert(q.question, 'Question should have question text');
  assert(Array.isArray(q.options) && q.options.length === 4, 'Question should have 4 options');
  assert(typeof q.correct_answer === 'number', 'Question should have correct_answer index');
  
  generatedQuestions = res.data.data.questions;
  log('Test 2', `Generated ${generatedQuestions.length} questions successfully`);
  log('Test 2', `Sample Q1: ${generatedQuestions[0].question.substring(0, 50)}...`);
  
  return generatedQuestions;
}

async function test3_CreateQuizWithSubjectBatch() {
  console.log('\n📋 TEST 3: Create quiz with subjectId + batchId');
  
  // Modify first question to simulate "editing" before publish
  const editedQuestions = generatedQuestions.map((q, i) => ({
    ...q,
    question: i === 0 ? `[EDITED] ${q.question}` : q.question
  }));
  
  const payload = {
    course_id: 'WILL_BE_RESOLVED_FROM_SUBJECT', // Backend will resolve from subject
    subjectId: TEST_SUBJECT_ID,
    batchId: TEST_BATCH_ID,
    title: `Test Quiz: ${TEST_TOPIC}`,
    description: 'Auto-generated test quiz for chain flow verification',
    questions: editedQuestions,
    pass_percentage: 60,
    max_attempts: 3,
    timer_minutes: 30
  };
  
  const res = await apiRequest('POST', '/api/quizzes', payload, INSTRUCTOR_TOKEN);
  
  if (res.status === 403) {
    throw new Error(`Access denied - instructor not assigned. ${res.data?.message}`);
  }
  
  assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
  assert(res.data.success === true, 'Response should have success: true');
  assert(res.data.data?._id, 'Response should have quiz _id');
  assert(res.data.data.subjectId, 'Quiz should have subjectId stored');
  assert(res.data.data.batchId, 'Quiz should have batchId stored');
  
  createdQuizId = res.data.data._id;
  log('Test 3', `Quiz created with ID: ${createdQuizId}`);
  log('Test 3', `Subject: ${res.data.data.subjectId}, Batch: ${res.data.data.batchId}`);
  
  return createdQuizId;
}

async function test4_PublishQuiz() {
  console.log('\n📋 TEST 4: Publish the quiz');
  
  const res = await apiRequest('PATCH', `/api/quizzes/${createdQuizId}/publish`, null, INSTRUCTOR_TOKEN);
  
  assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
  assert(res.data.success === true, 'Response should have success: true');
  assert(res.data.data?.status === 'PUBLISHED', 'Quiz status should be PUBLISHED');
  
  log('Test 4', `Quiz published successfully! Status: ${res.data.data.status}`);
  
  // Give notifications a moment to process
  console.log('   ⏳ Waiting 1s for notification processing...');
  await new Promise(r => setTimeout(r, 1000));
  
  return res.data.data;
}

async function test5_StudentSeesPublishedQuiz() {
  console.log('\n📋 TEST 5: Student in batch sees the published quiz');
  
  // Try college student endpoint first
  const res = await apiRequest('GET', '/api/college/student/quizzes', null, STUDENT_TOKEN);
  
  assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
  assert(res.data.success === true, 'Response should have success: true');
  
  const quizzes = res.data.data?.quizzes || res.data.data || [];
  assert(Array.isArray(quizzes), 'Response quizzes should be an array');
  
  // Look for our created quiz
  const foundQuiz = quizzes.find(q => 
    String(q._id) === String(createdQuizId) || 
    String(q.id) === String(createdQuizId)
  );
  
  if (!foundQuiz) {
    console.log(`   ⚠️  Available quizzes (${quizzes.length}):`);
    quizzes.slice(0, 3).forEach(q => console.log(`      - ${q._id || q.id}: ${q.title?.substring(0, 30)}`));
    throw new Error(`Student cannot see the published quiz ${createdQuizId}. Found ${quizzes.length} quizzes.`);
  }
  
  log('Test 5', `✓ Student sees published quiz: "${foundQuiz.title?.substring(0, 40)}..."`);
  log('Test 5', `  Quiz has ${foundQuiz.questions_count || foundQuiz.questions?.length || '?'} questions`);
  
  return foundQuiz;
}

async function test6_VerifyNotificationCreated() {
  console.log('\n📋 TEST 6: Verify notification was created (optional)');
  
  // Check student notifications
  const res = await apiRequest('GET', '/api/notifications', null, STUDENT_TOKEN);
  
  if (res.status !== 200 || !res.data.success) {
    console.log('   ⚠️  Could not verify notifications (endpoint may differ)');
    return null;
  }
  
  const notifications = res.data.data?.notifications || res.data.data || [];
  const quizNotification = notifications.find(n => 
    n.data?.quizId === createdQuizId || 
    n.title?.toLowerCase().includes('quiz')
  );
  
  if (quizNotification) {
    log('Test 6', `✓ Student has notification: "${quizNotification.title}"`);
  } else {
    console.log('   ℹ️  No quiz notification found (may be async or different format)');
  }
  
  return quizNotification;
}

// ==================== MAIN TEST RUNNER ====================

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     COLLEGE CHAIN QUIZ FLOW - END TO END TEST            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nAPI URL: ${API_URL}`);
  console.log(`Subject: ${TEST_SUBJECT_ID}`);
  console.log(`Batch: ${TEST_BATCH_ID}`);
  
  // Validate config
  if (INSTRUCTOR_TOKEN.includes('YOUR_') || TEST_SUBJECT_ID.includes('YOUR_')) {
    console.error('\n❌ ERROR: Please set test configuration!');
    console.error('   Option 1: Set env vars: TEST_INSTRUCTOR_TOKEN, TEST_SUBJECT_ID, TEST_BATCH_ID');
    console.error('   Option 2: Edit this file and replace the placeholder values');
    console.error('\n   To get tokens:');
    console.error('   - Login as instructor/student in your app');
    console.error('   - Open browser DevTools → Application → Local Storage');
    console.error('   - Copy "instatute_token" value');
    process.exit(1);
  }
  
  const tests = [
    { name: 'Instructor lists subjects', fn: test1_InstructorCanGetSubjects },
    { name: 'AI Generate with subject+batch', fn: test2_AIGenerateQuizWithSubjectBatch },
    { name: 'Create quiz with subject+batch', fn: test3_CreateQuizWithSubjectBatch },
    { name: 'Publish quiz', fn: test4_PublishQuiz },
    { name: 'Student sees published quiz', fn: test5_StudentSeesPublishedQuiz },
    { name: 'Notification created', fn: test6_VerifyNotificationCreated }
  ];
  
  for (const test of tests) {
    try {
      await test.fn();
      testResults.passed++;
    } catch (error) {
      testResults.failed++;
      testResults.errors.push({ test: test.name, error: error.message });
      log(test.name, error.message, true);
    }
  }
  
  // Print summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    TEST SUMMARY                           ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Passed: ${testResults.passed}/${tests.length}`);
  console.log(`❌ Failed: ${testResults.failed}/${tests.length}`);
  
  if (testResults.errors.length > 0) {
    console.log('\nErrors:');
    testResults.errors.forEach(e => console.log(`  - ${e.test}: ${e.error}`));
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  
  if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Chain flow is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  SOME TESTS FAILED. Check errors above.');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

// Run
runTests();
