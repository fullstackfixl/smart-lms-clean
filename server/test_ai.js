const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

const aiService = require('./src/services/aiService');

async function testAI() {
    console.log('🧪 Testing Gemini AI Quiz Generation...');
    try {
        const prompt = "JavaScript Closures and Scopes";
        const num = 2;
        const diff = "medium";

        console.log(`Prompt: "${prompt}", Count: ${num}, Difficulty: ${diff}`);
        const questions = await aiService.generateGeminiQuiz(prompt, num, diff, "mock_course", "mock_org");

        console.log('\n✅ AI Response Received:');
        console.log(JSON.stringify(questions, null, 2));

        if (questions && questions.length > 0 && questions[0].question) {
            console.log('\n✨ AI GENERATION IS WORKING PROPERLY!');
        } else {
            console.error('\n❌ AI returned empty or invalid data');
        }
        process.exit(0);
    } catch (error) {
        console.error('\n❌ AI GENERATION FAILED:', error.message);
        process.exit(1);
    }
}

testAI();
