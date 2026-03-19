/**
 * SIMPLIFIED AUTOMATED TEST - Uses existing database data
 * No setup needed - just needs valid tokens and IDs from your DB
 * 
 * Run: node test-chain-simple.js
 */

const API_URL = process.env.API_URL || 'http://localhost:5000';

// CONFIG - Replace these with actual values from your database
const CONFIG = {
  // Get these from browser localStorage after login
  instructorToken: process.env.INST_TOKEN || 'YOUR_INSTRUCTOR_JWT',
  studentToken: process.env.STUD_TOKEN || 'YOUR_STUDENT_JWT',
  
  // Get these from your MongoDB or from /instructor/subjects API
  subjectId: process.env.SUBJECT_ID || 'YOUR_SUBJECT_ID',
  batchId: process.env.BATCH_ID || 'YOUR_BATCH_ID',
  courseId: process.env.COURSE_ID || 'YOUR_COURSE_ID' // Subject's contentCourseId
};

let quizId = null;
let generatedQuestions = null;

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

async function run() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  CHAIN FLOW TEST - Using existing DB data               ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  // Validate config
  const missing = Object.entries(CONFIG).filter(([k, v]) => !v || v.includes('YOUR_'));
  if (missing.length > 0) {
    console.error('\n❌ Missing configuration:');
    missing.forEach(([k]) => console.error(`   - ${k}`));
    console.error('\nSet env vars or edit CONFIG in this file:\n');
    console.error('   set INST_TOKEN=eyJhbG...');
    console.error('   set STUD_TOKEN=eyJhbG...');
    console.error('   set SUBJECT_ID=65f8...');
    console.error('   set BATCH_ID=65f8...');
    console.error('   set COURSE_ID=65f8...');
    console.error('\nTo get tokens: Login in browser → DevTools → LocalStorage → instatute_token');
    console.error('To get IDs: GET /instructor/subjects with instructor token');
    process.exit(1);
  }
  
  console.log(`\nUsing Subject: ${CONFIG.subjectId}`);
  console.log(`Using Batch: ${CONFIG.batchId}`);
  
  try {
    // TEST 1: Verify instructor sees subject
    console.log('\n📋 TEST 1: Instructor sees assigned subjects');
    const subjRes = await api('GET', '/instructor/subjects', null, CONFIG.instructorToken);
    
    if (subjRes.status !== 200) throw new Error(`Failed: ${subjRes.status}`);
    const subjects = subjRes.data?.data || [];
    const found = subjects.find(s => String(s._id || s.subjectId) === CONFIG.subjectId);
    
    if (!found) {
      console.log('Available subjects:', subjects.map(s => ({ id: s._id || s.subjectId, name: s.name })));
      throw new Error('Subject not found in instructor list');
    }
    log('T1', `Found: ${found.name || found.code}`);
    
    // TEST 2: AI Generate
    console.log('\n📋 TEST 2: AI Generate with subject+batch');
    const aiRes = await api('POST', '/api/quizzes/generate-ai', {
      subjectId: CONFIG.subjectId,
      batchId: CONFIG.batchId,
      topic: 'Test Quiz Generation',
      num_questions: 3,
      difficulty: 'easy'
    }, CONFIG.instructorToken);
    
    if (aiRes.status === 403) throw new Error(`Not authorized: ${aiRes.data?.message}`);
    if (aiRes.status === 400 && aiRes.data?.message?.includes('contentCourseId')) {
      throw new Error('Subject missing contentCourseId mapping');
    }
    if (aiRes.status !== 200) throw new Error(`AI failed: ${aiRes.status} - ${JSON.stringify(aiRes.data)}`);
    
    generatedQuestions = aiRes.data?.data?.questions || aiRes.data?.questions;
    if (!generatedQuestions?.length) throw new Error('No questions returned');
    log('T2', `Generated ${generatedQuestions.length} questions`);
    
    // TEST 3: Create Quiz
    console.log('\n📋 TEST 3: Create quiz with subjectId+batchId');
    const createRes = await api('POST', '/api/quizzes', {
      course_id: CONFIG.courseId,
      subjectId: CONFIG.subjectId,
      batchId: CONFIG.batchId,
      title: 'Chain Flow Test Quiz',
      description: 'Testing subject+batch chain',
      questions: generatedQuestions.map((q, i) => ({ ...q, question: `[Q${i + 1}] ${q.question}` })),
      pass_percentage: 60,
      max_attempts: 3,
      timer_minutes: 30
    }, CONFIG.instructorToken);
    
    if (createRes.status !== 201) throw new Error(`Create failed: ${createRes.status} - ${JSON.stringify(createRes.data)}`);
    
    quizId = createRes.data?.data?._id || createRes.data?.data?.id || createRes.data?.quiz?._id;
    if (!quizId) throw new Error('No quiz ID returned');
    
    const quiz = createRes.data?.data;
    if (!quiz?.subjectId || !quiz?.batchId) throw new Error('Quiz missing subjectId or batchId');
    
    log('T3', `Created: ${quizId}`);
    log('T3', `  subjectId: ${quiz.subjectId}, batchId: ${quiz.batchId}`);
    
    // TEST 4: Publish
    console.log('\n📋 TEST 4: Publish quiz');
    const pubRes = await api('PATCH', `/api/quizzes/${quizId}/publish`, null, CONFIG.instructorToken);
    
    if (pubRes.status !== 200) throw new Error(`Publish failed: ${pubRes.status}`);
    if (pubRes.data?.data?.status !== 'PUBLISHED') throw new Error('Status not PUBLISHED');
    log('T4', 'Published successfully');
    
    // Wait for notifications
    await new Promise(r => setTimeout(r, 1500));
    
    // TEST 5: Student sees quiz
    console.log('\n📋 TEST 5: Student sees published quiz');
    const studRes = await api('GET', '/api/college/student/quizzes', null, CONFIG.studentToken);
    
    if (studRes.status !== 200) {
      // Try main endpoint as fallback
      const mainRes = await api('GET', '/api/quizzes?limit=100', null, CONFIG.studentToken);
      if (mainRes.status !== 200) throw new Error(`Both endpoints failed`);
      
      const quizzes = mainRes.data?.data?.quizzes || [];
      const foundQuiz = quizzes.find(q => String(q._id || q.id) === quizId);
      if (!foundQuiz) throw new Error('Student cannot see quiz');
      log('T5', `✓ Student sees via main endpoint: ${foundQuiz.title?.substring(0, 40)}`);
    } else {
      const quizzes = studRes.data?.data || [];
      const foundQuiz = quizzes.find(q => String(q._id || q.id) === quizId);
      if (!foundQuiz) {
        console.log('Student quizzes:', quizzes.map(q => ({ id: q._id || q.id, title: q.title?.substring(0, 30) })));
        throw new Error('Quiz not in student list');
      }
      log('T5', `✓ Student sees via college endpoint: ${foundQuiz.title?.substring(0, 40)}`);
    }
    
    // Cleanup
    console.log('\n🧹 Cleanup: Deleting test quiz...');
    await api('DELETE', `/api/quizzes/${quizId}`, null, CONFIG.instructorToken);
    log('Cleanup', 'Test quiz deleted');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED! Chain flow working correctly.');
    console.log('═══════════════════════════════════════════════════════════');
    process.exit(0);
    
  } catch (err) {
    console.error(`\n❌ TEST FAILED: ${err.message}`);
    
    // Cleanup on failure
    if (quizId) {
      console.log('\n🧹 Cleanup on failure...');
      await api('DELETE', `/api/quizzes/${quizId}`, null, CONFIG.instructorToken);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('⚠️ TEST FAILED');
    console.log('═══════════════════════════════════════════════════════════');
    process.exit(1);
  }
}

run();
