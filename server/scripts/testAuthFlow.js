/* eslint-disable no-console */

if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-jwt-secret';
if (!process.env.JWT_EXPIRES_IN) process.env.JWT_EXPIRES_IN = '7d';

const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const { Organization, User } = require('../src/models');

async function connectDB() {
  const mongo = await MongoMemoryServer.create({
    binary: { version: '4.4.29' }
  });
  const uri = mongo.getUri();
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000
  });
  return { mongo, uri };
}

async function login(path, email, password) {
  const res = await request(app).post(path).send({ email, password });
  return res;
}

async function expect403(res, label) {
  if (res.status !== 403) {
    throw new Error(`${label}: expected 403, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
  }
  console.log(`✅ ${label} -> 403 as expected`);
}

async function expect200(res, label) {
  if (res.status !== 200 || !res.body?.success) {
    throw new Error(`${label}: expected 200 success, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
  }
  console.log(`✅ ${label} -> success`);
}

async function main() {
  const { mongo } = await connectDB();

  const org = await Organization.create({
    name: 'E2E Org',
    email: 'e2e-org@test.com',
    status: 'active',
    type: 'college',
    subdomain: 'e2e-org'
  });

  const passwords = {
    platformAdmin: 'Password123!P',
    orgAdmin: 'Password123!O',
    instructor: 'Password123!I',
    student: 'Password123!S'
  };

  await User.create({
    email: 'platform+e2e@test.com',
    name: 'Platform Admin',
    role: 'platform_admin',
    password_hash: passwords.platformAdmin,
    status: 'active',
    email_verified: true,
    isActive: true,
    organization_id: null
  });

  await User.create({
    email: 'orgadmin+e2e@test.com',
    name: 'Org Admin',
    role: 'org_admin',
    organization_id: org._id,
    password_hash: passwords.orgAdmin,
    status: 'active',
    email_verified: true,
    isActive: true
  });

  await User.create({
    email: 'instructor+e2e@test.com',
    name: 'Instructor',
    role: 'instructor',
    organization_id: org._id,
    password_hash: passwords.instructor,
    status: 'active',
    email_verified: true,
    isActive: true
  });

  await User.create({
    email: 'student+e2e@test.com',
    name: 'Student',
    role: 'student',
    organization_id: org._id,
    password_hash: passwords.student,
    status: 'active',
    email_verified: true,
    isActive: true
  });

  // Success cases
  await expect200(await login('/api/auth/platform-admin/login', 'platform+e2e@test.com', passwords.platformAdmin), 'platform admin -> platform-admin login');
  await expect200(await login('/api/auth/org-admin/login', 'orgadmin+e2e@test.com', passwords.orgAdmin), 'org admin -> org-admin login');
  await expect200(await login('/api/auth/login', 'student+e2e@test.com', passwords.student), 'student -> /login');
  await expect200(await login('/api/auth/login', 'instructor+e2e@test.com', passwords.instructor), 'instructor -> /login');

  // Failure cases
  await expect403(await login('/api/auth/login', 'platform+e2e@test.com', passwords.platformAdmin), 'platform admin -> /login (blocked)');
  await expect403(await login('/api/auth/platform-admin/login', 'orgadmin+e2e@test.com', passwords.orgAdmin), 'org admin -> platform-admin login (blocked)');
  await expect403(await login('/api/auth/org-admin/login', 'student+e2e@test.com', passwords.student), 'student -> org-admin login (blocked)');
  await expect403(await login('/api/auth/platform-admin/login', 'instructor+e2e@test.com', passwords.instructor), 'instructor -> platform-admin login (blocked)');

  console.log('🎉 testAuthFlow PASSED');

  await mongoose.disconnect();
  await mongo.stop();
}

main().catch((err) => {
  console.error('❌ testAuthFlow FAILED:', err);
  process.exitCode = 1;
});
