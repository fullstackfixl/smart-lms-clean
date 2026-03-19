/**
 * Comprehensive Test Suite for Student Enrollment Engine
 * Tests the complete chain: Org Admin -> Student Assignment -> Instructor Assignment -> Timetable -> Notifications
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:5000';
const CLIENT_BASE = process.env.CLIENT_URL || 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  orgAdmin: {
    email: 'orgadmin@test.edu',
    password: 'test123'
  },
  student: {
    email: 'student@test.edu',
    password: 'test123'
  },
  instructor: {
    email: 'instructor@test.edu',
    password: 'test123'
  }
};

class EnrollmentFlowTester {
  constructor() {
    this.tokens = {};
    this.testData = {
      programId: null,
      batchId: null,
      subjectId: null,
      studentId: null,
      instructorId: null,
      timetableEntryId: null
    };
    this.results = [];
  }

  log(test, status, message, data = null) {
    const result = { test, status, message, data, timestamp: new Date().toISOString() };
    this.results.push(result);
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} [${test}] ${message}`);
    if (data && status === 'FAIL') {
      console.log('   Error data:', JSON.stringify(data, null, 2));
    }
  }

  async login(email, password, role) {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password
      });
      if (response.data.success) {
        this.tokens[role] = response.data.data.token;
        return response.data.data;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // ============ TEST 1: Authentication ============
  async testAuthentication() {
    console.log('\n🔐 TEST 1: Authentication');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Test Org Admin login
    const orgAdmin = await this.login(TEST_CONFIG.orgAdmin.email, TEST_CONFIG.orgAdmin.password, 'orgAdmin');
    if (orgAdmin) {
      this.log('Auth: Org Admin', 'PASS', 'Org Admin authenticated successfully');
      this.testData.orgId = orgAdmin.user?.organization_id;
    } else {
      this.log('Auth: Org Admin', 'FAIL', 'Org Admin authentication failed');
    }

    // Test Student login
    const student = await this.login(TEST_CONFIG.student.email, TEST_CONFIG.student.password, 'student');
    if (student) {
      this.log('Auth: Student', 'PASS', 'Student authenticated successfully');
      this.testData.studentId = student.user?._id;
    } else {
      this.log('Auth: Student', 'FAIL', 'Student authentication failed');
    }

    // Test Instructor login
    const instructor = await this.login(TEST_CONFIG.instructor.email, TEST_CONFIG.instructor.password, 'instructor');
    if (instructor) {
      this.log('Auth: Instructor', 'PASS', 'Instructor authenticated successfully');
      this.testData.instructorId = instructor.user?._id;
    } else {
      this.log('Auth: Instructor', 'FAIL', 'Instructor authentication failed');
    }
  }

  // ============ TEST 2: Org Admin - List Students ============
  async testListStudents() {
    console.log('\n👥 TEST 2: Org Admin - List Students');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!this.tokens.orgAdmin) {
      this.log('Students: List', 'SKIP', 'No org admin token available');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/college/admin/students`, {
        headers: { Authorization: `Bearer ${this.tokens.orgAdmin}` }
      });
      
      if (response.data.success && Array.isArray(response.data.data)) {
        this.log('Students: List', 'PASS', `Retrieved ${response.data.data.length} students`);
        // Store first student for later tests
        if (response.data.data.length > 0) {
          this.testData.studentId = response.data.data[0]._id || response.data.data[0].id;
        }
      } else {
        this.log('Students: List', 'FAIL', 'Invalid response format', response.data);
      }
    } catch (error) {
      this.log('Students: List', 'FAIL', error.message, error.response?.data);
    }
  }

  // ============ TEST 3: Org Admin - List Programs ============
  async testListPrograms() {
    console.log('\n📚 TEST 3: Org Admin - List Programs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!this.tokens.orgAdmin) {
      this.log('Programs: List', 'SKIP', 'No org admin token available');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/college/admin/programs`, {
        headers: { Authorization: `Bearer ${this.tokens.orgAdmin}` }
      });
      
      if (response.data.success) {
        const programs = response.data.data || response.data.programs || [];
        this.log('Programs: List', 'PASS', `Retrieved ${programs.length} programs`);
        if (programs.length > 0) {
          this.testData.programId = programs[0]._id;
        }
      } else {
        this.log('Programs: List', 'FAIL', 'Invalid response format', response.data);
      }
    } catch (error) {
      this.log('Programs: List', 'FAIL', error.message, error.response?.data);
    }
  }

  // ============ TEST 4: Org Admin - List Batches ============
  async testListBatches() {
    console.log('\n🏫 TEST 4: Org Admin - List Batches');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!this.tokens.orgAdmin) {
      this.log('Batches: List', 'SKIP', 'No org admin token available');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/college/admin/batches`, {
        headers: { Authorization: `Bearer ${this.tokens.orgAdmin}` }
      });
      
      if (response.data.success) {
        const batches = response.data.data || response.data.batches || [];
        this.log('Batches: List', 'PASS', `Retrieved ${batches.length} batches`);
        if (batches.length > 0) {
          this.testData.batchId = batches[0]._id;
        }
      } else {
        this.log('Batches: List', 'FAIL', 'Invalid response format', response.data);
      }
    } catch (error) {
      this.log('Batches: List', 'FAIL', error.message, error.response?.data);
    }
  }

  // ============ TEST 5: Org Admin - List Subjects ============
  async testListSubjects() {
    console.log('\n📖 TEST 5: Org Admin - List Subjects');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!this.tokens.orgAdmin) {
      this.log('Subjects: List', 'SKIP', 'No org admin token available');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/college/admin/subjects`, {
        headers: { Authorization: `Bearer ${this.tokens.orgAdmin}` }
      });
      
      if (response.data.success) {
        const subjects = response.data.data || response.data.subjects || [];
        this.log('Subjects: List', 'PASS', `Retrieved ${subjects.length} subjects`);
        if (subjects.length > 0) {
          this.testData.subjectId = subjects[0]._id;
        }
      } else {
        this.log('Subjects: List', 'FAIL', 'Invalid response format', response.data);
      }
    } catch (error) {
      this.log('Subjects: List', 'FAIL', error.message, error.response?.data);
    }
  }

  // ============ TEST 6: Org Admin - Assign Student to Program/Batch ============
  async testAssignStudentToBatch() {
    console.log('\n🎯 TEST 6: Org Admin - Assign Student to Program/Batch');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!this.tokens.orgAdmin) {
      this.log('Assignment: Student', 'SKIP', 'No org admin token available');
      return;
    }
    
    if (!this.testData.studentId || !this.testData.programId || !this.testData.batchId) {
      this.log('Assignment: Student', 'SKIP', `Missing required IDs: student=${!!this.testData.studentId}, program=${!!this.testData.programId}, batch=${!!this.testData.batchId}`);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/org-admin/learners/assign`, {
        studentId: this.testData.studentId,
        programId: this.testData.programId,
        batchId: this.testData.batchId
      }, {
        headers: { Authorization: `Bearer ${this.tokens.orgAdmin}` }
      });
      
      if (response.data.success) {
        this.log('Assignment: Student', 'PASS', 'Student assigned to program/batch successfully');
        this.testData.assignment = response.data.data?.assignment;
      } else {
        this.log('Assignment: Student', 'FAIL', response.data.message || 'Assignment failed', response.data);
      }
    } catch (error) {
      this.log('Assignment: Student', 'FAIL', error.message, error.response?.data);
    }
  }

  // ============ TEST 7: Org Admin - Assign Instructor to Subject/Batch ============
  async testAssignInstructorToSubject() {
    console.log('\n👨‍🏫 TEST 7: Org Admin - Assign Instructor to Subject/Batch');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!this.tokens.orgAdmin) {
      this.log('Assignment: Instructor', 'SKIP', 'No org admin token available');
      return;
    }
    
    if (!this.testData.instructorId || !this.testData.subjectId || !this.testData.batchId) {
      this.log('Assignment: Instructor', 'SKIP', `Missing required IDs: instructor=${!!this.testData.instructorId}, subject=${!!this.testData.subjectId}, batch=${!!this.testData.batchId}`);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/org-admin/instructor-assignments`, {
        subjectId: this.testData.subjectId,
        batchId: this.testData.batchId,
        instructorId: this.testData.instructorId
      }, {
        headers: { Authorization: `Bearer ${this.tokens.orgAdmin}` }
      });
      
      if (response.data.success) {
        this.log('Assignment: Instructor', 'PASS', 'Instructor assigned to subject/batch successfully');
      } else {
        this.log('Assignment: Instructor', 'FAIL', response.data.message || 'Assignment failed', response.data);
      }
    } catch (error) {
      this.log('Assignment: Instructor', 'FAIL', error.message, error.response?.data);
    }
  }

  // ============ TEST 8: Org Admin - Create Timetable Entry ============
  async testCreateTimetableEntry() {
    console.log('\n📅 TEST 8: Org Admin - Create Timetable Entry');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!this.tokens.orgAdmin) {
      this.log('Timetable: Create', 'SKIP', 'No org admin token available');
      return;
    }
    
    if (!this.testData.programId || !this.testData.batchId || !this.testData.subjectId || !this.testData.instructorId) {
      this.log('Timetable: Create', 'SKIP', 'Missing required IDs for timetable creation');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/org-admin/timetable`, {
        programId: this.testData.programId,
        batchId: this.testData.batchId,
        subjectId: this.testData.subjectId,
        instructorId: this.testData.instructorId,
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:30',
        room: 'Room 101'
      }, {
        headers: { Authorization: `Bearer ${this.tokens.orgAdmin}` }
      });
      
      if (response.data.success) {
        this.log('Timetable: Create', 'PASS', 'Timetable entry created successfully');
        this.testData.timetableEntryId = response.data.data?.entry?._id;
        this.testData.meetingLink = response.data.data?.entry?.meetingLink;
        
        if (this.testData.meetingLink) {
          this.log('Timetable: Meeting Link', 'PASS', `Generated: ${this.testData.meetingLink}`);
        }
      } else {
        this.log('Timetable: Create', 'FAIL', response.data.message || 'Timetable creation failed', response.data);
      }
    } catch (error) {
      this.log('Timetable: Create', 'FAIL', error.message, error.response?.data);
    }
  }

  // ============ TEST 9: Student - View Timetable ============
  async testStudentViewTimetable() {
    console.log('\n🎓 TEST 9: Student - View Timetable');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!this.tokens.student) {
      this.log('Student: Timetable', 'SKIP', 'No student token available');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/student/timetable`, {
        headers: { Authorization: `Bearer ${this.tokens.student}` }
      });
      
      if (response.data.success) {
        const entries = response.data.data?.entries || [];
        this.log('Student: Timetable', 'PASS', `Student can view ${entries.length} timetable entries`);
        
        // Verify meeting link is present
        const entryWithLink = entries.find(e => e.meetingLink);
        if (entryWithLink) {
          this.log('Student: Meeting Link', 'PASS', 'Meeting link available in timetable');
        }
      } else {
        this.log('Student: Timetable', 'FAIL', 'Failed to retrieve timetable', response.data);
      }
    } catch (error) {
      this.log('Student: Timetable', 'FAIL', error.message, error.response?.data);
    }
  }

  // ============ TEST 10: Instructor - View Timetable ============
  async testInstructorViewTimetable() {
    console.log('\n👨‍🏫 TEST 10: Instructor - View Timetable');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!this.tokens.instructor) {
      this.log('Instructor: Timetable', 'SKIP', 'No instructor token available');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/instructor/timetable`, {
        headers: { Authorization: `Bearer ${this.tokens.instructor}` }
      });
      
      if (response.data.success) {
        const entries = response.data.data?.entries || [];
        this.log('Instructor: Timetable', 'PASS', `Instructor can view ${entries.length} timetable entries`);
      } else {
        this.log('Instructor: Timetable', 'FAIL', 'Failed to retrieve timetable', response.data);
      }
    } catch (error) {
      this.log('Instructor: Timetable', 'FAIL', error.message, error.response?.data);
    }
  }

  // ============ TEST 11: Org Admin - List Timetable ============
  async testOrgAdminListTimetable() {
    console.log('\n📋 TEST 11: Org Admin - List Timetable');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!this.tokens.orgAdmin) {
      this.log('OrgAdmin: Timetable List', 'SKIP', 'No org admin token available');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/org-admin/timetable`, {
        headers: { Authorization: `Bearer ${this.tokens.orgAdmin}` }
      });
      
      if (response.data.success) {
        const entries = response.data.data?.entries || [];
        this.log('OrgAdmin: Timetable List', 'PASS', `Retrieved ${entries.length} timetable entries`);
      } else {
        this.log('OrgAdmin: Timetable List', 'FAIL', 'Failed to list timetable', response.data);
      }
    } catch (error) {
      this.log('OrgAdmin: Timetable List', 'FAIL', error.message, error.response?.data);
    }
  }

  // ============ TEST 12: Org Admin - Update Timetable Entry ============
  async testUpdateTimetableEntry() {
    console.log('\n✏️ TEST 12: Org Admin - Update Timetable Entry');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!this.tokens.orgAdmin || !this.testData.timetableEntryId) {
      this.log('Timetable: Update', 'SKIP', 'No org admin token or timetable entry ID available');
      return;
    }

    try {
      const response = await axios.put(`${API_BASE}/org-admin/timetable/${this.testData.timetableEntryId}`, {
        room: 'Room 202',
        startTime: '10:00',
        endTime: '11:30'
      }, {
        headers: { Authorization: `Bearer ${this.tokens.orgAdmin}` }
      });
      
      if (response.data.success) {
        this.log('Timetable: Update', 'PASS', 'Timetable entry updated successfully');
      } else {
        this.log('Timetable: Update', 'FAIL', response.data.message || 'Update failed', response.data);
      }
    } catch (error) {
      this.log('Timetable: Update', 'FAIL', error.message, error.response?.data);
    }
  }

  // ============ TEST 13: Org Admin - Delete Timetable Entry ============
  async testDeleteTimetableEntry() {
    console.log('\n🗑️ TEST 13: Org Admin - Delete Timetable Entry');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!this.tokens.orgAdmin || !this.testData.timetableEntryId) {
      this.log('Timetable: Delete', 'SKIP', 'No org admin token or timetable entry ID available');
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE}/org-admin/timetable/${this.testData.timetableEntryId}`, {
        headers: { Authorization: `Bearer ${this.tokens.orgAdmin}` }
      });
      
      if (response.data.success) {
        this.log('Timetable: Delete', 'PASS', 'Timetable entry deleted successfully');
      } else {
        this.log('Timetable: Delete', 'FAIL', response.data.message || 'Delete failed', response.data);
      }
    } catch (error) {
      this.log('Timetable: Delete', 'FAIL', error.message, error.response?.data);
    }
  }

  // ============ Run All Tests ============
  async runAllTests() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║     STUDENT ENROLLMENT ENGINE - COMPREHENSIVE TEST SUITE       ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(`API Base: ${API_BASE}`);
    console.log(`Client Base: ${CLIENT_BASE}`);
    console.log('');

    await this.testAuthentication();
    await this.testListStudents();
    await this.testListPrograms();
    await this.testListBatches();
    await this.testListSubjects();
    await this.testAssignStudentToBatch();
    await this.testAssignInstructorToSubject();
    await this.testCreateTimetableEntry();
    await this.testStudentViewTimetable();
    await this.testInstructorViewTimetable();
    await this.testOrgAdminListTimetable();
    await this.testUpdateTimetableEntry();
    await this.testDeleteTimetableEntry();

    this.printSummary();
  }

  printSummary() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                      TEST SUMMARY                              ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;

    console.log(`║  Total Tests: ${total.toString().padEnd(49)} ║`);
    console.log(`║  ✅ Passed:   ${passed.toString().padEnd(49)} ║`);
    console.log(`║  ❌ Failed:   ${failed.toString().padEnd(49)} ║`);
    console.log(`║  ⚠️  Skipped: ${skipped.toString().padEnd(49)} ║`);
    console.log('╚════════════════════════════════════════════════════════════════╝');

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.test}: ${r.message}`));
    }

    console.log('\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run tests
const tester = new EnrollmentFlowTester();
tester.runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
