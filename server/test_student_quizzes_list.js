const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testStudentQuizzesAggregation() {
    console.log('--- Testing Student Quizzes Aggregation ---');
    try {
        // 1. Login as the student from seed data
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'student1@test.com',
            password: 'password123'
        });
        const token = loginRes.data.data.token;
        console.log('✓ Student logged in');

        // 2. Fetch all quizzes
        const quizzesRes = await axios.get(`${API_URL}/student/quizzes`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const quizzes = quizzesRes.data.data.quizzes;
        console.log(`✓ Retrieved ${quizzes.length} total quizzes`);

        if (quizzes.length > 0) {
            quizzes.forEach((q, i) => {
                console.log(`\nQuiz ${i + 1}: ${q.title}`);
                console.log(`  Course: ${q.course.title}`);
                console.log(`  Attempts: ${q.attemptsCount}`);
                console.log(`  Best Score: ${q.bestScore || 'N/A'}`);
                console.log(`  Is Completed: ${q.isCompleted}`);
            });
        }

        console.log('\n--- Test Completed Successfully ---');
    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

testStudentQuizzesAggregation();
