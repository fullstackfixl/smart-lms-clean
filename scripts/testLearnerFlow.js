/**
 * Test script for Learners Module
 * Run: node scripts/testLearnerFlow.js
 */

const API_BASE = 'http://localhost:5000';
const AUTH_TOKEN = process.env.TEST_TOKEN || 'your-test-token-here';

// Test data
const testStudent = {
  firstName: 'Test',
  lastName: 'Student',
  email: `test${Date.now()}@example.com`,
  rollNumber: `ROLL${Date.now()}`,
  password: 'test12345'
};

async function apiCall(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`${API_BASE}${endpoint}`, options);
  return res.json();
}

async function runTests() {
  console.log('\n========================================');
  console.log('   LEARNERS MODULE TEST SUITE');
  console.log('========================================\n');

  let studentId = null;
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Create Student
  try {
    console.log('Test 1: Creating student...');
    const res = await apiCall('POST', '/api/college/admin/students', testStudent);
    if (res.success) {
      studentId = res.data.student._id;
      console.log('✅ Student created:', studentId);
      testsPassed++;
    } else {
      console.log('❌ Failed:', res.message);
      testsFailed++;
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
    testsFailed++;
  }

  // Test 2: Assign Batch
  if (studentId) {
    try {
      console.log('\nTest 2: Assigning batch...');
      const res = await apiCall('PATCH', `/api/college/admin/learners/${studentId}/assign-batch`, {
        programId: 'test-program-id',
        departmentId: 'test-dept-id', 
        batchId: 'test-batch-id',
        semester: 1
      });
      if (res.success) {
        console.log('✅ Batch assigned');
        testsPassed++;
      } else {
        console.log('❌ Failed:', res.message);
        testsFailed++;
      }
    } catch (err) {
      console.log('❌ Error:', err.message);
      testsFailed++;
    }
  }

  // Test 3: Enroll Subjects
  if (studentId) {
    try {
      console.log('\nTest 3: Enrolling subjects...');
      const res = await apiCall('POST', `/api/college/admin/learners/${studentId}/enroll-subjects`, {
        subjectIds: ['subject-1', 'subject-2']
      });
      if (res.success) {
        console.log('✅ Subjects enrolled:', res.data.enrolledCount);
        testsPassed++;
      } else {
        console.log('❌ Failed:', res.message);
        testsFailed++;
      }
    } catch (err) {
      console.log('❌ Error:', err.message);
      testsFailed++;
    }
  }

  // Test 4: Update Status
  if (studentId) {
    try {
      console.log('\nTest 4: Updating status...');
      const res = await apiCall('PATCH', `/api/college/admin/learners/${studentId}/status`, {
        status: 'active'
      });
      if (res.success) {
        console.log('✅ Status updated');
        testsPassed++;
      } else {
        console.log('❌ Failed:', res.message);
        testsFailed++;
      }
    } catch (err) {
      console.log('❌ Error:', err.message);
      testsFailed++;
    }
  }

  // Summary
  console.log('\n========================================');
  console.log(`   RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('========================================\n');
}

runTests().catch(console.error);
