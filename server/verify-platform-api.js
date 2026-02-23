require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

async function verifyAPI() {
    console.log('🚀 Starting API Verification...');

    // 1. Get a token (Assume we can use the bypass or just check public access if any)
    // For verification, we can just check if routes are mounted by connecting to DB and checking counts vs API

    const BASE_URL = 'http://localhost:5000/platform';

    try {
        console.log('--- Testing Public Super Admin Creation Route ---');
        // This is public, should return 403 because admin already exists (which is fine, confirms route exists)
        const resAdmin = await axios.post(`${BASE_URL}/create-super-admin`, { name: 'Test', email: 'test@test.com', password: '123' }).catch(e => e.response);
        console.log(`POST /create-super-admin: ${resAdmin?.status} ${resAdmin?.data?.message}`);

        console.log('\n--- Testing Protected Routes (Expect 401/403 without token) ---');
        // This confirms the middleware is active
        const resStats = await axios.get(`${BASE_URL}/dashboard/stats`).catch(e => e.response);
        console.log(`GET /dashboard/stats: ${resStats?.status} (Expected 401/403)`);

        console.log('\n--- Database Integrity Check ---');
        await mongoose.connect(process.env.MONGODB_URI);
        const { Organization, User, Course, Enrollment } = require('./src/models');

        const counts = {
            orgs: await Organization.countDocuments({ is_deleted: false }),
            users: await User.countDocuments({ is_deleted: false }),
            courses: await Course.countDocuments({ is_deleted: false }),
            enrollments: await Enrollment.countDocuments({})
        };
        console.log('REAL DB COUNTS:', JSON.stringify(counts, null, 2));

        console.log('\n✨ Verification script finished.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        process.exit(1);
    }
}

verifyAPI();
