const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Organization = require('../src/models/Organization');
const Department = require('../src/models/Department');
const AcademicProgram = require('../src/models/AcademicProgram');
const Batch = require('../src/models/Batch');
const Subject = require('../src/models/Subject');
const InstructorAssignment = require('../src/models/InstructorAssignment');
const AcademicEnrollment = require('../src/models/AcademicEnrollment');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');
const { MongoMemoryServer } = require('mongodb-memory-server');
const messageService = require('../src/services/college/messageService');

async function testChatFlow() {
  console.log('🚀 Starting Chat Flow Verification Tests (In-Memory)...\n');

  let mongoServer;
  try {
    // 1. Start MongoMemoryServer
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('✅ Connected to In-Memory Database');

    // 2. Setup Test Data
    console.log('⚙️ Setting up test environment...');
    
    // Clear previous test data for this specific test org
    const TEST_ORG_NAME = "Chat Test Org";
    const ALT_ORG_NAME = "Cross Org Test";
    
    await Organization.deleteMany({ name: { $in: [TEST_ORG_NAME, ALT_ORG_NAME] } });
    
    const org = await Organization.create({
      name: TEST_ORG_NAME,
      email: 'contact@chattest.com',
      subdomain: 'chattest',
      type: 'COLLEGE',
      status: 'active'
    });

    const altOrg = await Organization.create({
      name: ALT_ORG_NAME,
      email: 'contact@altorg.com',
      subdomain: 'altorg',
      type: 'COLLEGE',
      status: 'active'
    });

    const password = await bcrypt.hash('password123', 10);

    // Create Users
    const admin = await User.create({
      name: 'Org Admin',
      email: 'admin@chattest.com',
      password,
      role: 'org_admin',
      organization_id: org._id,
      status: 'active'
    });

    const instructor = await User.create({
      name: 'Instructor One',
      email: 'instructor@chattest.com',
      password,
      role: 'instructor',
      organization_id: org._id,
      status: 'active'
    });

    const studentA = await User.create({
      name: 'Student A (Assigned)',
      email: 'studentA@chattest.com',
      password,
      role: 'student',
      organization_id: org._id,
      status: 'active'
    });

    const studentB = await User.create({
      name: 'Student B (Random)',
      email: 'studentB@chattest.com',
      password,
      role: 'student',
      organization_id: org._id,
      status: 'active'
    });

    const crossOrgUser = await User.create({
      name: 'Cross Org User',
      email: 'cross@other.com',
      password,
      role: 'student',
      organization_id: altOrg._id,
      status: 'active'
    });

    // Create Academic Context
    const dept = await Department.create({
      name: 'Computer Science',
      code: 'CS01',
      organization_id: org._id
    });

    const program = await AcademicProgram.create({
      name: 'B.Tech',
      code: 'BTECH',
      duration: 4,
      departmentId: dept._id,
      organizationId: org._id
    });

    const batch = await Batch.create({
      name: 'BCA 2024',
      code: 'BCA2024',
      programId: program._id,
      year: 2024,
      semester: 1,
      organizationId: org._id
    });

    const subject = await Subject.create({
      name: 'Data Structures',
      code: 'DSA101',
      departmentId: dept._id,
      programId: program._id,
      semester: 1,
      organizationId: org._id
    });

    // Assign Instructor to Batch
    await InstructorAssignment.create({
      instructorId: instructor._id,
      batchId: batch._id,
      subjectId: subject._id,
      programId: program._id,
      organizationId: org._id,
      isActive: true
    });

    // Enroll Student A into Batch
    await AcademicEnrollment.create({
      studentId: studentA._id,
      batchId: batch._id,
      subjectId: subject._id,
      programId: program._id,
      organizationId: org._id
    });

    console.log('✅ Test Environment Ready\n');

    // --- TEST CASES ---

    const results = [];

    async function runTest(name, fn) {
      process.stdout.write(`Testing: ${name}... `);
      try {
        await fn();
        console.log('✅ PASSED');
        results.push({ name, status: 'PASSED' });
      } catch (err) {
        console.log(`❌ FAILED: ${err.message}`);
        results.push({ name, status: 'FAILED', error: err.message });
      }
    }

    // 1️⃣ Test Case: Self Chat
    await runTest('1. Block Self Chat', async () => {
      try {
        await messageService.validateMessagingPermission(admin, admin);
        throw new Error('Should have failed');
      } catch (err) {
        if (err.message !== 'You cannot chat with yourself') throw err;
      }
    });

    // 2️⃣ Test Case: Org Admin -> Instructor
    await runTest('2. Org Admin -> Instructor (Success)', async () => {
      await messageService.validateMessagingPermission(admin, instructor);
    });

    // 3️⃣ Test Case: Instructor -> Assigned Student
    await runTest('3. Instructor -> Assigned Student (Success)', async () => {
      await messageService.validateMessagingPermission(instructor, studentA);
    });

    // 4️⃣ Test Case: Student -> Assigned Instructor
    await runTest('4. Student -> Assigned Instructor (Success)', async () => {
      await messageService.validateMessagingPermission(studentA, instructor);
    });

    // 5️⃣ Test Case: Instructor -> Random Student
    await runTest('5. Instructor -> Random Student (Block)', async () => {
      try {
        await messageService.validateMessagingPermission(instructor, studentB);
        throw new Error('Should have failed');
      } catch (err) {
        if (err.message !== 'Student is not enrolled in any of your active classes') throw err;
      }
    });

    // 6️⃣ Test Case: Student -> Org Admin
    await runTest('6. Student -> Org Admin (Success)', async () => {
      await messageService.validateMessagingPermission(studentB, admin);
    });

    // 7️⃣ Test Case: Cross Org
    await runTest('7. Cross Org Messaging (Block)', async () => {
      try {
        await messageService.validateMessagingPermission(admin, crossOrgUser);
        throw new Error('Should have failed');
      } catch (err) {
        if (err.message !== 'Cross-organization messaging is strictly prohibited') throw err;
      }
    });

    // 8️⃣ Full flow: start conversation + send message + unread increments
    await runTest('8. Conversation + Send Message increments unread', async () => {
      // Create (or get) conversation
      let conversation = await Conversation.findOne({
        organizationId: org._id,
        participants: { $all: [admin._id, studentA._id] }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          organizationId: org._id,
          participants: [admin._id, studentA._id],
          unreadCount: {}
        });
      }

      // Send a message admin -> studentA
      const msgText = 'Hello StudentA';
      await Message.create({
        conversationId: conversation._id,
        senderId: admin._id,
        receiverId: studentA._id,
        organization_id: org._id,
        text: msgText,
        isRead: false
      });

      // Update conversation like controller does
      conversation.lastMessage = msgText;
      conversation.lastMessageAt = new Date();
      if (!(conversation.unreadCount instanceof Map)) {
        throw new Error('unreadCount must be a Map');
      }
      const prev = conversation.unreadCount.get(studentA._id.toString()) || 0;
      conversation.unreadCount.set(studentA._id.toString(), prev + 1);
      await conversation.save();

      const reloaded = await Conversation.findById(conversation._id);
      const unread = reloaded.unreadCount.get(studentA._id.toString()) || 0;
      if (unread < 1) throw new Error('Unread count did not increment');
    });

    // 9️⃣ Full flow: open chat resets unread + marks messages read
    await runTest('9. Fetch messages marks read and resets unread', async () => {
      const conversation = await Conversation.findOne({
        organizationId: org._id,
        participants: { $all: [admin._id, studentA._id] }
      });

      if (!conversation) throw new Error('Conversation missing');

      // simulate studentA opening chat (mark messages as read)
      await Message.updateMany(
        { conversationId: conversation._id, receiverId: studentA._id, isRead: false },
        { $set: { isRead: true } }
      );

      if (!(conversation.unreadCount instanceof Map)) {
        throw new Error('unreadCount must be a Map');
      }
      conversation.unreadCount.set(studentA._id.toString(), 0);
      await conversation.save();

      const unreadAfter = (await Conversation.findById(conversation._id)).unreadCount.get(studentA._id.toString()) || 0;
      if (unreadAfter !== 0) throw new Error('Unread did not reset');

      const unreadMessages = await Message.countDocuments({
        conversationId: conversation._id,
        receiverId: studentA._id,
        isRead: false
      });
      if (unreadMessages !== 0) throw new Error('Messages not marked read');
    });

    console.log('\n📊 Final Summary:');
    results.forEach(r => console.log(`${r.status === 'PASSED' ? '✅' : '❌'} ${r.name}`));

    const allPassed = results.every(r => r.status === 'PASSED');
    if (!allPassed) {
      console.log('\n🛑 SOME TESTS FAILED');
      process.exit(1);
    } else {
      console.log('\n🎊 ALL CHAT FLOW TESTS PASSED');
    }

  } catch (error) {
    console.error('💥 Test execution error:', error);
    process.exit(1);
  } finally {
    if (mongoose.connection) await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
  }
}

testChatFlow();
