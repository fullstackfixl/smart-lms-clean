/**
 * ATTENDANCE SYSTEM - COMPLETE FLOW TEST SUITE
 * 
 * Tests the full attendance lifecycle across all 3 roles.
 * Usage:  node test-attendance-flow.js
 * Custom: ORG_ADMIN_EMAIL=x ORG_ADMIN_PASS=x INSTRUCTOR_EMAIL=x ... node test-attendance-flow.js
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:5000';

const TEST_CONFIG = {
  orgAdmin:   { email: process.env.ORG_ADMIN_EMAIL   || 'dushyant22062003@gmail.com',   password: process.env.ORG_ADMIN_PASS   || 'test123' },
  instructor: { email: process.env.INSTRUCTOR_EMAIL  || 'dushyant4665@gmail.com', password: process.env.INSTRUCTOR_PASS  || 'test123' },
  student:    { email: process.env.STUDENT_EMAIL     || 'dushyantkhandelwal4665@gmail.com',    password: process.env.STUDENT_PASS     || 'test123' },
};

class AttendanceTester {
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
  // PHASE 2: Preflight - fetch IDs to use in subsequent tests
  // ============================================================
  async testPreflight() {
    console.log('\n--- PHASE 2: Preflight (fetch test IDs) ---');

    const tok = this.tokens.orgAdmin;
    if (!tok) { this.log('Preflight', 'SKIP', 'No org admin token'); return; }

    // Batches
    const bRes = await this.req('get', '/api/college/admin/batches', tok);
    const batches = bRes.data?.data?.batches ?? bRes.data?.data ?? [];
    if (bRes.ok && batches.length > 0) {
      this.data.batchId   = batches[0]._id;
      this.data.batchName = batches[0].name;
      this.log('Preflight Batches', 'PASS', `Using "${batches[0].name}" (${batches[0]._id})`);
    } else {
      this.log('Preflight Batches', 'FAIL', 'No batches found - create one first', bRes.data);
    }

    // Subjects
    const sRes = await this.req('get', '/api/college/admin/subjects', tok);
    const subjects = sRes.data?.data?.subjects ?? sRes.data?.data ?? [];
    if (sRes.ok && subjects.length > 0) {
      this.data.subjectId   = subjects[0]._id;
      this.data.subjectName = subjects[0].name;
      this.log('Preflight Subjects', 'PASS', `Using "${subjects[0].name}" (${subjects[0]._id})`);
    } else {
      this.log('Preflight Subjects', 'FAIL', 'No subjects found - create one first', sRes.data);
    }

    // Students in batch (uses instructor endpoint)
    if (this.data.subjectId && this.data.batchId) {
      const stRes = await this.req(
        'get',
        `/api/college/instructor/attendance/students-for-attendance/${this.data.subjectId}/${this.data.batchId}`,
        this.tokens.instructor || tok
      );
      const students = stRes.data?.data?.students ?? [];
      if (stRes.ok) {
        this.data.students = students;
        this.log('Preflight Students', 'PASS', `${students.length} student(s) in batch`);
        students.slice(0, 2).forEach((s, i) => {
          console.log(`         [${i+1}] ${s.full_name} - ${s.roll_number || s.email}`);
        });
        // Also save a studentId for admin report test
        if (!this.data.studentId && students.length > 0) {
          this.data.studentId = students[0]._id;
        }
      } else {
        this.log('Preflight Students', 'FAIL', stRes.data?.message || 'Request failed', stRes.data);
      }
    }
  }

  // ============================================================
  // PHASE 3: Instructor - Today's assigned sessions
  // ============================================================
  async testAssignedSessions() {
    console.log('\n--- PHASE 3: Instructor - Today\'s Assigned Sessions ---');

    const tok = this.tokens.instructor;
    if (!tok) { this.log('Assigned Sessions', 'SKIP', 'No instructor token'); return; }

    const { ok, data } = await this.req('get', '/api/college/instructor/attendance/assigned-sessions', tok);
    const sessions = Array.isArray(data?.data) ? data.data : [];

    if (ok) {
      this.log('Assigned Sessions', 'PASS', `${sessions.length} session(s) for today`);
      sessions.forEach((s, i) => {
        const done = s.attendanceMarked ? ' [DONE]' : ' [PENDING]';
        console.log(`         [${i+1}] ${s.subject?.name} | ${s.batch?.name} | ${s.startTime}-${s.endTime}${done}`);
      });
    } else {
      this.log('Assigned Sessions', 'FAIL', data?.message || 'Request failed', data);
    }
  }

  // ============================================================
  // PHASE 4: Instructor - GET students for attendance
  // ============================================================
  async testGetStudentsForAttendance() {
    console.log('\n--- PHASE 4: Instructor - Get Students for Attendance ---');

    const tok = this.tokens.instructor || this.tokens.orgAdmin;
    const { subjectId, batchId } = this.data;

    if (!tok || !subjectId || !batchId) {
      this.log('Students for Attendance', 'SKIP', `tok=${!!tok} subjectId=${!!subjectId} batchId=${!!batchId}`);
      return;
    }

    const { ok, data } = await this.req(
      'get',
      `/api/college/instructor/attendance/students-for-attendance/${subjectId}/${batchId}`,
      tok
    );

    if (ok) {
      const students = data?.data?.students ?? [];
      const subject  = data?.data?.subject;
      const batch    = data?.data?.batch;
      this.log('Students for Attendance', 'PASS',
        `${students.length} student(s) | Subject: ${subject?.name} | Batch: ${batch?.name}`);
    } else {
      this.log('Students for Attendance', 'FAIL', data?.message || 'Request failed', data);
    }
  }

  // ============================================================
  // PHASE 5: Instructor - POST mark attendance
  // ============================================================
  async testMarkAttendance() {
    console.log('\n--- PHASE 5: Instructor - Mark Attendance ---');

    const tok = this.tokens.instructor || this.tokens.orgAdmin;
    const { subjectId, batchId, students } = this.data;

    if (!tok || !subjectId || !batchId) {
      this.log('Mark Attendance', 'SKIP', `tok=${!!tok} subjectId=${!!subjectId} batchId=${!!batchId}`);
      return;
    }
    if (!students || students.length === 0) {
      this.log('Mark Attendance', 'SKIP', 'No students in batch to mark');
      return;
    }

    const statuses = ['present', 'absent', 'late'];
    const attendance_records = students.map((s, i) => ({
      student_id: s._id,
      status: statuses[i % statuses.length],
      notes: `Test - ${statuses[i % statuses.length]}`,
      late_minutes: (i % 3 === 2) ? 10 : 0
    }));

    const today = new Date().toISOString().split('T')[0];
    const { ok, data } = await this.req('post', '/api/college/instructor/attendance/mark-attendance', tok, {
      subjectId,
      batchId,
      session_date: today,
      start_time: '09:00',
      end_time: '10:00',
      session_title: `Test Session - ${this.data.subjectName}`,
      topic_covered: 'Test Topic',
      attendance_records
    });

    if (ok) {
      this.data.attendanceId = data?.data?._id;
      const present = attendance_records.filter(r => r.status === 'present').length;
      const absent  = attendance_records.filter(r => r.status === 'absent').length;
      const late    = attendance_records.filter(r => r.status === 'late').length;
      this.log('Mark Attendance', 'PASS',
        `${students.length} students | present=${present} absent=${absent} late=${late}`);
      console.log(`         Attendance ID: ${this.data.attendanceId}`);
      console.log(`         Message: ${data?.message}`);
    } else {
      this.log('Mark Attendance', 'FAIL', data?.message || 'Request failed', data);
    }
  }

  // ============================================================
  // PHASE 6: Instructor - GET attendance history
  // ============================================================
  async testInstructorHistory() {
    console.log('\n--- PHASE 6: Instructor - Attendance History ---');

    const tok = this.tokens.instructor || this.tokens.orgAdmin;
    if (!tok) { this.log('Instructor History', 'SKIP', 'No token'); return; }

    const { ok, data } = await this.req('get', '/api/college/instructor/attendance/attendance-history', tok);

    if (ok) {
      const records = data?.data?.records ?? [];
      const summary = data?.data?.summary ?? {};
      this.log('Instructor History', 'PASS',
        `${records.length} session(s) | Avg attendance: ${summary.average_attendance ?? 0}%`);
      records.slice(0, 3).forEach((r, i) => {
        const date  = new Date(r.session_date).toLocaleDateString();
        const sub   = r.subjectId?.name || '--';
        const bat   = r.batchId?.name || '--';
        const pres  = r.attendance_records?.filter(x => x.status === 'present').length ?? 0;
        const total = r.attendance_records?.length ?? 0;
        console.log(`         [${i+1}] ${date} | ${sub} | ${bat} | ${pres}/${total} present`);
      });
    } else {
      this.log('Instructor History', 'FAIL', data?.message || 'Request failed', data);
    }
  }

  // ============================================================
  // PHASE 7: Instructor - History with filters
  // ============================================================
  async testInstructorHistoryFiltered() {
    console.log('\n--- PHASE 7: Instructor - Filtered History ---');

    const tok = this.tokens.instructor || this.tokens.orgAdmin;
    if (!tok) { this.log('Filtered History', 'SKIP', 'No token'); return; }

    const params = new URLSearchParams();
    if (this.data.subjectId) params.set('subjectId', this.data.subjectId);
    if (this.data.batchId)   params.set('batchId',   this.data.batchId);
    params.set('limit', '5');

    const { ok, data } = await this.req(
      'get',
      `/api/college/instructor/attendance/attendance-history?${params}`,
      tok
    );

    if (ok) {
      const records = data?.data?.records ?? [];
      this.log('Filtered History', 'PASS', `${records.length} record(s) for subject+batch filter`);
    } else {
      this.log('Filtered History', 'FAIL', data?.message || 'Request failed', data);
    }
  }

  // ============================================================
  // PHASE 8: Student - GET full attendance
  // ============================================================
  async testStudentMyAttendance() {
    console.log('\n--- PHASE 8: Student - Full Attendance Summary ---');

    const tok = this.tokens.student;
    if (!tok) { this.log('Student My Attendance', 'SKIP', 'No student token'); return; }

    const { ok, data } = await this.req('get', '/api/college/student/attendance/my-attendance', tok);

    if (ok) {
      const overall  = data?.data?.overall_summary ?? {};
      const subjects = data?.data?.subject_summary ?? [];
      const records  = data?.data?.attendance_records ?? [];
      this.log('Student My Attendance', 'PASS',
        `${overall.totalClasses ?? 0} total classes | Overall: ${overall.overallPercentage ?? 0}%`);
      console.log(`         Subjects: ${subjects.length} | Session records: ${records.length}`);
      subjects.forEach(s => {
        const flag = s.percentage >= 75 ? 'OK' : s.percentage >= 60 ? 'LOW' : 'DANGER';
        console.log(`         [${flag}] ${s.subject?.name}: ${s.percentage}% (${s.present}/${s.totalClasses})`);
      });
      if (subjects.length > 0 && !this.data.subjectId) {
        this.data.subjectId = subjects[0].subject._id;
      }
    } else {
      this.log('Student My Attendance', 'FAIL', data?.message || 'Request failed', data);
    }
  }

  // ============================================================
  // PHASE 9: Student - GET by subject
  // ============================================================
  async testStudentBySubject() {
    console.log('\n--- PHASE 9: Student - Attendance By Subject ---');

    const tok = this.tokens.student;
    if (!tok || !this.data.subjectId) {
      this.log('Student By Subject', 'SKIP', `tok=${!!tok} subjectId=${!!this.data.subjectId}`);
      return;
    }

    const { ok, data } = await this.req(
      'get',
      `/api/college/student/attendance/attendance-by-subject/${this.data.subjectId}`,
      tok
    );

    if (ok) {
      const records = data?.data?.records ?? [];
      const summary = data?.data?.summary ?? {};
      const subject = data?.data?.subject;
      this.log('Student By Subject', 'PASS',
        `${subject?.name}: ${summary.percentage ?? 0}% | ${records.length} session(s)`);
      records.slice(0, 3).forEach(r => {
        const date = new Date(r.date).toLocaleDateString();
        console.log(`         ${r.status.toUpperCase()} | ${date} | ${r.startTime}-${r.endTime} | ${r.topicCovered || '--'}`);
      });
    } else {
      this.log('Student By Subject', 'FAIL', data?.message || 'Request failed', data);
    }
  }

  // ============================================================
  // PHASE 10: Admin - dashboard
  // ============================================================
  async testAdminDashboard() {
    console.log('\n--- PHASE 10: Admin - Attendance Dashboard ---');

    const tok = this.tokens.orgAdmin;
    if (!tok) { this.log('Admin Dashboard', 'SKIP', 'No org admin token'); return; }

    const { ok, data } = await this.req('get', '/api/college/admin/attendance/dashboard', tok);

    if (ok) {
      const d = data?.data ?? {};
      this.log('Admin Dashboard', 'PASS',
        `Today: ${d.today_sessions} sessions | Monthly: ${d.monthly_stats?.percentage ?? 0}%`);
      console.log(`         Active Batches:  ${d.active_batches}`);
      console.log(`         Active Subjects: ${d.active_subjects}`);
      console.log(`         Monthly Sessions: ${d.monthly_stats?.total_sessions}`);
      console.log(`         Monthly Present:  ${d.monthly_stats?.present} | Absent: ${d.monthly_stats?.absent} | Late: ${d.monthly_stats?.late}`);
    } else {
      this.log('Admin Dashboard', 'FAIL', data?.message || 'Request failed', data);
    }
  }

  // ============================================================
  // PHASE 11: Admin - records with filters
  // ============================================================
  async testAdminRecords() {
    console.log('\n--- PHASE 11: Admin - Attendance Records ---');

    const tok = this.tokens.orgAdmin;
    if (!tok) { this.log('Admin Records', 'SKIP', 'No org admin token'); return; }

    // All records
    {
      const { ok, data } = await this.req('get', '/api/college/admin/attendance/records?limit=5', tok);
      if (ok) {
        const records = data?.data?.records ?? [];
        const pag = data?.data?.pagination ?? {};
        this.log('Admin Records (all)', 'PASS', `${pag.total_items ?? records.length} total | showing ${records.length}`);
        records.slice(0, 2).forEach(r => {
          const date = new Date(r.date).toLocaleDateString();
          const pct  = r.totalStudents > 0 ? Math.round(((r.present + r.late) / r.totalStudents) * 100) : 0;
          console.log(`         ${date} | ${r.subject?.name} | ${r.batch?.name} | ${r.present}/${r.totalStudents} (${pct}%)`);
        });
      } else {
        this.log('Admin Records (all)', 'FAIL', data?.message, data);
      }
    }

    // Filter by batch
    if (this.data.batchId) {
      const { ok, data } = await this.req(
        'get', `/api/college/admin/attendance/records?batchId=${this.data.batchId}&limit=5`, tok
      );
      if (ok) {
        const records = data?.data?.records ?? [];
        this.log('Admin Records (batch filter)', 'PASS', `${records.length} record(s) for batch "${this.data.batchName}"`);
      } else {
        this.log('Admin Records (batch filter)', 'FAIL', data?.message, data);
      }
    }

    // Filter by date range (last 7 days)
    {
      const today = new Date().toISOString().split('T')[0];
      const past  = new Date(); past.setDate(past.getDate() - 7);
      const pastStr = past.toISOString().split('T')[0];
      const { ok, data } = await this.req(
        'get', `/api/college/admin/attendance/records?startDate=${pastStr}&endDate=${today}&limit=5`, tok
      );
      if (ok) {
        const records = data?.data?.records ?? [];
        this.log('Admin Records (last 7d)', 'PASS', `${records.length} record(s) in last 7 days`);
      } else {
        this.log('Admin Records (last 7d)', 'FAIL', data?.message, data);
      }
    }
  }

  // ============================================================
  // PHASE 12: Admin - student report
  // ============================================================
  async testAdminStudentReport() {
    console.log('\n--- PHASE 12: Admin - Student Report ---');

    const tok       = this.tokens.orgAdmin;
    const studentId = this.data.studentId || this.data.studentsampleId;

    if (!tok || !studentId) {
      this.log('Admin Student Report', 'SKIP', `tok=${!!tok} studentId=${!!studentId}`);
      return;
    }

    const { ok, data } = await this.req('get', `/api/college/admin/attendance/student-report/${studentId}`, tok);

    if (ok) {
      const student  = data?.data?.student ?? {};
      const overall  = data?.data?.overall_summary ?? {};
      const subjects = data?.data?.subject_summary ?? [];
      this.log('Admin Student Report', 'PASS',
        `${student.full_name} | Overall: ${overall.overallPercentage ?? 0}%`);
      console.log(`         Total: ${overall.totalClasses} | Present: ${overall.present} | Absent: ${overall.absent}`);
      subjects.forEach(s => {
        console.log(`         ${s.subject?.name}: ${s.percentage}% (${s.present}/${s.total})`);
      });
    } else {
      this.log('Admin Student Report', 'FAIL', data?.message || 'Request failed', data);
    }
  }

  // ============================================================
  // PHASE 13: Admin - batch summary
  // ============================================================
  async testAdminBatchSummary() {
    console.log('\n--- PHASE 13: Admin - Batch Summary ---');

    const tok = this.tokens.orgAdmin;
    if (!tok || !this.data.batchId) {
      this.log('Admin Batch Summary', 'SKIP', `tok=${!!tok} batchId=${!!this.data.batchId}`);
      return;
    }

    const { ok, data } = await this.req(
      'get', `/api/college/admin/attendance/batch-summary/${this.data.batchId}`, tok
    );

    if (ok) {
      const d          = data?.data ?? {};
      const studentAtt = d.student_attendance ?? [];
      const subjSum    = d.subject_summary ?? [];
      this.log('Admin Batch Summary', 'PASS',
        `"${this.data.batchName}" | ${d.total_sessions} sessions | ${studentAtt.length} student(s)`);
      studentAtt.slice(0, 3).forEach(s => {
        const flag = s.percentage >= 75 ? 'OK' : s.percentage >= 60 ? 'LOW' : 'DANGER';
        console.log(`         [${flag}] ${s.student?.full_name}: ${s.percentage}% (${s.present}/${s.totalClasses})`);
      });
      subjSum.forEach(s => {
        const rate = s.totalStudents > 0
          ? Math.round(((s.present + s.late) / s.totalStudents) * 100) : 0;
        console.log(`         Subject "${s.subject?.name}": ${s.totalClasses} classes | ${rate}% avg`);
      });
    } else {
      this.log('Admin Batch Summary', 'FAIL', data?.message || 'Request failed', data);
    }
  }

  // ============================================================
  // PHASE 14: Instructor - Update existing attendance
  // ============================================================
  async testUpdateAttendance() {
    console.log('\n--- PHASE 14: Instructor - Update Attendance (re-mark) ---');

    const tok = this.tokens.instructor || this.tokens.orgAdmin;
    const { subjectId, batchId, students } = this.data;

    if (!tok || !subjectId || !batchId || !students?.length) {
      this.log('Update Attendance', 'SKIP', 'Missing tokens or IDs or students');
      return;
    }

    // Send same date/time again - backend should UPDATE not duplicate
    const today = new Date().toISOString().split('T')[0];
    const attendance_records = students.map(s => ({
      student_id: s._id,
      status: 'present',
      notes: 'Updated - all present'
    }));

    const { ok, data } = await this.req('post', '/api/college/instructor/attendance/mark-attendance', tok, {
      subjectId, batchId,
      session_date: today,
      start_time: '09:00',
      end_time: '10:00',
      session_title: 'Updated Session',
      attendance_records
    });

    if (ok) {
      this.log('Update Attendance', 'PASS', `${data?.message} - All ${students.length} students set to present`);
    } else {
      this.log('Update Attendance', 'FAIL', data?.message || 'Request failed', data);
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
    console.log('            ATTENDANCE FLOW - TEST SUMMARY');
    console.log('============================================================');
    console.log(`  Total   : ${passed + failed + skipped}`);
    console.log(`  [PASS]  : ${passed}`);
    console.log(`  [FAIL]  : ${failed}`);
    console.log(`  [SKIP]  : ${skipped}`);
    console.log('============================================================');

    const fs = require('fs');
    fs.writeFileSync('detailed-errors.json', JSON.stringify(this.results.filter(r => r.status === 'FAIL'), null, 2));

    if (failed > 0) {
      console.log('\nFailed Tests:');
      this.results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  - ${r.name}: ${r.msg}`);
      });
    }

    if (skipped > 0) {
      console.log('\nSkipped (requires data setup or login):');
      this.results.filter(r => r.status === 'SKIP').forEach(r => {
        console.log(`  - ${r.name}: ${r.msg}`);
      });
    }

    console.log('');
    if (failed === 0 && skipped === 0) {
      console.log('ALL TESTS PASSED! Attendance system is fully functional.\n');
    } else if (failed === 0) {
      console.log('No failures! Skipped tests need data seeded first.\n');
    } else {
      console.log(`${failed} test(s) failed. Check output above for details.\n`);
    }

    process.exit(failed > 0 ? 1 : 0);
  }

  async run() {
    console.log('============================================================');
    console.log('       ATTENDANCE SYSTEM - COMPLETE FLOW TEST');
    console.log('============================================================');
    console.log('  API Base   :', API_BASE);
    console.log('  Org Admin  :', TEST_CONFIG.orgAdmin.email);
    console.log('  Instructor :', TEST_CONFIG.instructor.email);
    console.log('  Student    :', TEST_CONFIG.student.email);
    console.log('');

    await this.testAuth();
    await this.testPreflight();
    await this.testAssignedSessions();
    await this.testGetStudentsForAttendance();
    await this.testMarkAttendance();
    await this.testInstructorHistory();
    await this.testInstructorHistoryFiltered();
    await this.testStudentMyAttendance();
    await this.testStudentBySubject();
    await this.testAdminDashboard();
    await this.testAdminRecords();
    await this.testAdminStudentReport();
    await this.testAdminBatchSummary();
    await this.testUpdateAttendance();

    this.printSummary();
  }
}

new AttendanceTester().run().catch(err => {
  console.error('Test suite crashed:', err.message);
  process.exit(1);
});
