/**
 * Academic Layer Verification Script
 * This script verifies the core academic APIs (Semesters, Transcript, Overview).
 */
const axios = require('axios');

// Default API URL (Adjust if needed)
const API_URL = 'http://localhost:5000/api';

async function runTests(token) {
    if (!token) {
        console.error('❌ Error: No token provided. Run with Node verify_academic.js YOUR_TOKEN');
        return;
    }

    const client = axios.create({
        baseURL: API_URL,
        headers: { Authorization: `Bearer ${token}` }
    });

    console.log('🚀 Starting Academic Layer Verification...');

    try {
        // 1. Test Semesters API
        console.log('Testing GET /student/semesters...');
        const semsRes = await client.get('/student/semesters');
        if (semsRes.data.success) {
            console.log(`✅ Semesters found: ${semsRes.data.data.length}`);
        }

        // 2. Test Academic Overview API
        console.log('Testing GET /student/academic-overview...');
        const overviewRes = await client.get('/student/academic-overview');
        if (overviewRes.data.success) {
            console.log(`✅ Overview data: CGPA=${overviewRes.data.data.cgpa}, Credits=${overviewRes.data.data.totalCreditsEnrolled}`);
            if (overviewRes.data.data.gpa !== undefined) {
                console.log('✅ GPA alias verified');
            }
        }

        // 3. Test Transcript API
        console.log('Testing GET /student/transcript...');
        const transcriptRes = await client.get('/student/transcript');
        if (transcriptRes.data.success) {
            console.log(`✅ Transcript semesters: ${transcriptRes.data.data.semesters?.length || 0}`);
        }

        console.log('\n✨ All Academic Layer tests passed if no errors shown above! ✨');
    } catch (err) {
        console.error('❌ Test failed:', err.response?.data || err.message);
    }
}

// Get token from command line argument
const token = process.argv[2];
runTests(token);
