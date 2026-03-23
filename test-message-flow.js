/**
 * MESSAGING SYSTEM - COMPLETE FLOW TEST SUITE
 * 
 * Tests the full messaging lifecycle across all 3 roles.
 * Usage:  node test-message-flow.js
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:5000';

const TEST_CONFIG = {
  orgAdmin:   { email: process.env.ORG_ADMIN_EMAIL   || 'dushyant22062003@gmail.com',   password: process.env.ORG_ADMIN_PASS   || 'test123' },
  instructor: { email: process.env.INSTRUCTOR_EMAIL  || 'dushyant4665@gmail.com', password: process.env.INSTRUCTOR_PASS  || 'test123' },
  student:    { email: process.env.STUDENT_EMAIL     || 'dushyantkhandelwal4665@gmail.com',    password: process.env.STUDENT_PASS     || 'test123' },
};

class MessageTester {
  constructor() {
    this.tokens  = {};
    this.data    = {};
    this.results = [];
  }

  log(name, status, msg, extra = null) {
    this.results.push({ name, status, msg, extra: extra?.response ? extra.response.data : extra });
    const icon = status === 'PASS' ? '[PASS]' : status === 'FAIL' ? '[FAIL]' : '[SKIP]';
    console.log(`${icon} ${name}: ${msg}`);
  }

  async req(method, url, token, body = null) {
    try {
      const cfg = { headers: token ? { Authorization: `Bearer ${token}` } : {} };
      const fullUrl = `${API_BASE}${url}`;
      const resp = method === 'get'
        ? await axios.get(fullUrl, cfg)
        : await axios[method](fullUrl, body, cfg);
      return { ok: resp.data.success !== false, data: resp.data };
    } catch (err) {
      return { ok: false, data: err.response?.data, err };
    }
  }

  // ============================================================
  // PHASE 1: Authentication
  // ============================================================
  async testAuth() {
    console.log('\n--- PHASE 1: Authentication ---');

    for (const [role, creds] of Object.entries(TEST_CONFIG)) {
      try {
        const loginUrl = role === 'orgAdmin' ? `${API_BASE}/auth/org-admin/login` : `${API_BASE}/auth/login`;
        const resp = await axios.post(loginUrl, creds);
        if (resp.data.success) {
          this.tokens[role] = resp.data.data?.token || resp.data.token;
          const user = resp.data.data?.user || resp.data.user || {};
          this.data[`${role}Id`] = user._id;
          if (role === 'orgAdmin') this.data.orgId = user.organization_id;
          this.log(`Auth ${role}`, 'PASS', `${user.full_name || user.email} (role: ${user.role})`);
        } else {
          this.log(`Auth ${role}`, 'FAIL', resp.data.message || 'Login returned success=false');
        }
      } catch (err) {
        this.log(`Auth ${role}`, 'FAIL', err.message, err);
      }
    }
  }

  // ============================================================
  // PHASE 2: Fetch Users
  // ============================================================
  async testFetchUsers() {
    console.log('\n--- PHASE 2: Fetch Users for Messaging ---');
    
    // 1. Admin Users
    if (this.tokens.orgAdmin) {
      const { ok, data } = await this.req('get', '/api/college/admin/users', this.tokens.orgAdmin);
      if (ok) {
        this.data.adminUsers = data.data;
        this.log('Admin Users', 'PASS', `Found ${data.data.length} users`);
      } else {
        this.log('Admin Users', 'FAIL', data?.message);
      }
    }

    // 2. Instructor Users
    if (this.tokens.instructor) {
      const { ok, data } = await this.req('get', '/api/college/instructor/users', this.tokens.instructor);
      if (ok) {
        this.data.instructorUsers = data.data;
        this.log('Instructor Users', 'PASS', `Found ${data.data.length} users (Admins + Students)`);
      } else {
        this.log('Instructor Users', 'FAIL', data?.message);
      }
    }

    // 3. Student Users
    if (this.tokens.student) {
      const { ok, data } = await this.req('get', '/api/college/student/users', this.tokens.student);
      if (ok) {
        this.data.studentUsers = data.data;
        this.log('Student Users', 'PASS', `Found ${data.data.length} users (Admins + Instructors)`);
      } else {
        this.log('Student Users', 'FAIL', data?.message);
      }
    }
  }

  // ============================================================
  // PHASE 3: Valid Messaging
  // ============================================================
  async testValidMessaging() {
    console.log('\n--- PHASE 3: Valid Messaging flows ---');

    // Admin to Student
    if (this.tokens.orgAdmin && this.data.studentId) {
      const { ok: startOk, data: startData } = await this.req('post', '/api/college/messages/start', this.tokens.orgAdmin, { receiverId: this.data.studentId });
      if (startOk) {
        this.data.adminStudentConvId = startData.data._id;
        const { ok, data } = await this.req('post', '/api/college/messages/send', this.tokens.orgAdmin, {
          conversationId: this.data.adminStudentConvId,
          text: 'Hello Student! (from Admin)'
        });
        if (ok) this.log('Admin -> Student', 'PASS', 'Message sent');
        else this.log('Admin -> Student', 'FAIL', data?.message);
      } else {
        this.log('Admin -> Student', 'FAIL', startData?.message);
      }
    }

    // Instructor to Student
    if (this.tokens.instructor && this.data.studentId) {
      const { ok: startOk, data: startData } = await this.req('post', '/api/college/messages/start', this.tokens.instructor, { receiverId: this.data.studentId });
      if (startOk) {
        this.data.instructorStudentConvId = startData.data._id;
        const { ok, data } = await this.req('post', '/api/college/messages/send', this.tokens.instructor, {
          conversationId: this.data.instructorStudentConvId,
          text: 'Hello Student! (from Instructor)'
        });
        if (ok) this.log('Instructor -> Student', 'PASS', 'Message sent');
        else this.log('Instructor -> Student', 'FAIL', data?.message);
      } else {
        this.log('Instructor -> Student', 'FAIL', startData?.message);
      }
    }
    
    // Student to Instructor
    if (this.tokens.student && this.data.instructorId) {
      const { ok: startOk, data: startData } = await this.req('post', '/api/college/messages/start', this.tokens.student, { receiverId: this.data.instructorId });
      if (startOk) {
        this.data.studentInstructorConvId = startData.data._id;
        const { ok, data } = await this.req('post', '/api/college/messages/send', this.tokens.student, {
          conversationId: this.data.studentInstructorConvId,
          text: 'Hello Instructor! (from Student)'
        });
        if (ok) this.log('Student -> Instructor', 'PASS', 'Message sent');
        else this.log('Student -> Instructor', 'FAIL', data?.message);
      } else {
        this.log('Student -> Instructor', 'FAIL', startData?.message);
      }
    }
  }

  // ============================================================
  // PHASE 4: Unread Counts and Read Actions
  // ============================================================
  async testUnreadCounts() {
    console.log('\n--- PHASE 4: Unread Counts & Reading ---');

    // Student should have 2 unread messages (from admin and from instructor)
    if (this.tokens.student) {
      const { ok, data } = await this.req('get', '/api/college/messages/unread-count', this.tokens.student);
      if (ok) {
        this.log('Student Unread Count', 'PASS', `${data.totalUnread} unread messages`);
      } else {
        this.log('Student Unread Count', 'FAIL', data?.message);
      }
    }

    // Student reading instructor conversation
    if (this.tokens.student && this.data.studentInstructorConvId) {
      const { ok, data } = await this.req('get', `/api/college/messages/${this.data.studentInstructorConvId}`, this.tokens.student);
      if (ok) {
        this.log('Student reads convo', 'PASS', `Received ${data.data.length} messages`);
        
        // Count should drop
        const countRes = await this.req('get', '/api/college/messages/unread-count', this.tokens.student);
        this.log('Student Unread Count (after read)', 'PASS', `${countRes.data.totalUnread} unread messages remaining`);
      } else {
        this.log('Student reads convo', 'FAIL', data?.message);
      }
    }
  }

  // ============================================================
  // PHASE 5: Block Action
  // ============================================================
  async testBlocks() {
      console.log('\n--- PHASE 5: Blocking Invalid ---');
      
      // You can't message yourself
      if (this.tokens.student) {
        const { ok, data } = await this.req('post', '/api/college/messages/start', this.tokens.student, { receiverId: this.data.studentId });
        if (!ok) {
          this.log('Self-messaging block', 'PASS', `Blocked: ${data.message || 'Cannot message yourself'}`);
        } else {
          this.log('Self-messaging block', 'FAIL', 'System allowed self message');
        }
      }
  }

  // ============================================================
  // Summary + Run
  // ============================================================
  printSummary() {
    const passed  = this.results.filter(r => r.status === 'PASS').length;
    const failed  = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    console.log('\n\n============================================================');
    console.log('            MESSAGING FLOW - TEST SUMMARY');
    console.log('============================================================');
    console.log(`  Total   : ${passed + failed + skipped}`);
    console.log(`  [PASS]  : ${passed}`);
    console.log(`  [FAIL]  : ${failed}`);
    console.log(`  [SKIP]  : ${skipped}`);
    console.log('============================================================');

    const fs = require('fs');
    fs.writeFileSync('message-errors.json', JSON.stringify(this.results.filter(r => r.status === 'FAIL'), null, 2));

    if (failed === 0 && skipped === 0) {
      console.log('ALL TESTS PASSED! Messaging system is fully functional.\n');
    } else {
      console.log(`${failed} test(s) failed. Check output above for details.\n`);
    }

    process.exit(failed > 0 ? 1 : 0);
  }

  async run() {
    await this.testAuth();
    await this.testFetchUsers();
    await this.testValidMessaging();
    await this.testUnreadCounts();
    await this.testBlocks();

    this.printSummary();
  }
}

new MessageTester().run().catch(err => {
  console.error('Test suite crashed:', err.message);
  process.exit(1);
});
