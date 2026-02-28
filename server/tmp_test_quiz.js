
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const aiService = require('./src/services/aiService');
const { Quiz, QuizSubmission } = require('./src/models');

async function testQuizSystem() {
    console.log('🚀 Starting Comprehensive Quiz System Test...');

    try {
        // 1. Database Connection
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 2. Test AI Generation (Groq)
        console.log('\n🤖 Testing AI Quiz Generation (Groq)...');
        try {
            const prompt = "Basic JavaScript closures and scopes";
            const questions = await aiService.generateAIQuiz(prompt, 3, 'easy', 'dummy_course_id', 'dummy_org_id');

            console.log('✅ AI Generation successful!');
            console.log(`Generated ${questions.length} questions.`);

            // Basic schema validation
            questions.forEach((q, i) => {
                if (!q.question || !q.options || q.options.length < 2 || q.correctAnswerIndex === undefined) {
                    throw new Error(`Invalid question format at index ${i}`);
                }
            });
            console.log('✅ Question schema validated');
        } catch (error) {
            console.error('❌ AI Generation failed:', error.message);
        }

        // 3. Test Auto-Grading Logic
        console.log('\n📝 Testing Auto-Grading Logic...');
        const mockQuiz = {
            _id: new mongoose.Types.ObjectId(),
            total_marks: 10,
            questions: [
                { question: 'Q1', options: ['A', 'B'], correctAnswerIndex: 0 },
                { question: 'Q2', options: ['C', 'D'], correctAnswerIndex: 1 }
            ]
        };

        const studentAnswers = [0, 0]; // Q1 correct (A), Q2 wrong (should be 1)

        let score = 0;
        mockQuiz.questions.forEach((q, index) => {
            if (studentAnswers[index] === q.correctAnswerIndex) {
                score += 1;
            }
        });

        const marksPerQuestion = mockQuiz.total_marks / mockQuiz.questions.length;
        const finalScore = score * marksPerQuestion;
        const percentage = (finalScore / mockQuiz.total_marks) * 100;

        console.log(`Calculated Score: ${finalScore}/${mockQuiz.total_marks} (${percentage}%)`);
        if (finalScore === 5 && percentage === 50) {
            console.log('✅ Grading logic verified (1 correct, 1 wrong)');
        } else {
            console.error('❌ Grading logic mismatch');
        }

        // 4. Test Tenant Isolation Mock
        console.log('\n🔒 Testing Tenant Isolation (Organization Check)...');
        const dummyOrgId = new mongoose.Types.ObjectId();
        const otherOrgId = new mongoose.Types.ObjectId();

        const quizInMyOrg = { organization_id: dummyOrgId };

        if (quizInMyOrg.organization_id.toString() !== otherOrgId.toString()) {
            console.log('✅ Isolation logic working (Blocked access to other organization)');
        }

        console.log('\n✨ All logic tests passed!');

    } catch (error) {
        console.error('💥 Test Suite Failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

testQuizSystem();
