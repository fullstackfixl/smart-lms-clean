const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const connectDB = require('../src/config/database')
const Organization = require('../src/models/Organization')
const User = require('../src/models/User')
const Conversation = require('../src/models/Conversation')
const Message = require('../src/models/Message')
const Department = require('../src/models/Department')
const AcademicProgram = require('../src/models/AcademicProgram')
const Batch = require('../src/models/Batch')
const Subject = require('../src/models/Subject')
const InstructorAssignment = require('../src/models/InstructorAssignment')
const AcademicEnrollment = require('../src/models/AcademicEnrollment')

let mongoServer
let org
let instructor
let student
let instructorToken
let studentToken

function sign(user) {
  const payload = {
    userId: user._id,
    user_id: user._id,
    role: user.role,
    organizationId: user.organization_id,
    organization_id: user.organization_id
  }
  return jwt.sign(payload, process.env.JWT_SECRET)
}

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret'
  mongoServer = await MongoMemoryServer.create()
  process.env.MONGODB_URI = mongoServer.getUri()
  await connectDB()

  org = await Organization.create({
    name: 'Test College',
    type: 'college',
    subdomain: 'test-college',
    email: 'contact@testcollege.com',
    status: 'active'
  })

  instructor = await User.create({
    name: 'Instructor One',
    email: 'instructor@test.com',
    role: 'instructor',
    organization_id: org._id,
    status: 'active',
    email_verified: true,
    isActive: true
  })
  student = await User.create({
    name: 'Student One',
    email: 'student@test.com',
    role: 'student',
    organization_id: org._id,
    status: 'active',
    email_verified: true,
    isActive: true
  })

  const dept = await Department.create({
    organization_id: org._id,
    name: 'Computer Science',
    code: 'CSE'
  })
  const program = await AcademicProgram.create({
    name: 'B.Tech CSE',
    code: 'BTCSE',
    duration: 4,
    durationUnit: 'years',
    departmentId: dept._id,
    organizationId: org._id
  })
  const batch = await Batch.create({
    organizationId: org._id,
    name: 'CSE-2026',
    code: 'CSE26',
    programId: program._id,
    year: 2026,
    semester: 1,
    organizationType: 'college'
  })
  const subject = await Subject.create({
    organizationId: org._id,
    departmentId: dept._id,
    programId: program._id,
    name: 'Data Structures',
    code: 'DS101',
    semester: 1,
    isActive: true
  })
  await InstructorAssignment.create({
    organizationId: org._id,
    programId: program._id,
    batchId: batch._id,
    subjectId: subject._id,
    instructorId: instructor._id,
    isActive: true
  })
  await AcademicEnrollment.create({
    organizationId: org._id,
    studentId: student._id,
    programId: program._id,
    batchId: batch._id,
    subjectId: subject._id,
    instructorId: instructor._id
  })

  instructorToken = sign(instructor)
  studentToken = sign(student)
})

afterAll(async () => {
  await mongoose.connection.close()
  if (mongoServer) await mongoServer.stop()
})

describe('College Messaging', () => {
  test('start conversation and send message', async () => {
    const startRes = await request(app)
      .post('/api/college/messages/start')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ receiverId: String(student._id) })
      .expect(200)
    expect(startRes.body.success).toBe(true)
    const conversationId = startRes.body.data._id
    const sendRes = await request(app)
      .post('/api/college/messages/send')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ conversationId, text: 'Hello there' })
      .expect(201)
    expect(sendRes.body.success).toBe(true)
    const listRes = await request(app)
      .get(`/api/college/messages/${conversationId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200)
    expect(Array.isArray(listRes.body.data)).toBe(true)
    expect(listRes.body.data[0].text).toBe('Hello there')
    const unreadRes = await request(app)
      .get('/api/college/messages/unread-count')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200)
    expect(unreadRes.body.success).toBe(true)
  })

  test('profile endpoint role-based access', async () => {
    const profileAsStudent = await request(app)
      .get(`/api/college/messages/profile/${instructor._id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200)
    expect(profileAsStudent.body.success).toBe(true)
    expect(profileAsStudent.body.data._id).toBe(String(instructor._id))
    const profileAsInstructor = await request(app)
      .get(`/api/college/messages/profile/${student._id}`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .expect(200)
    expect(profileAsInstructor.body.success).toBe(true)
  })
})
