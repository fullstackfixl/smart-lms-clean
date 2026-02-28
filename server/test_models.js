require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const modelsToTest = [
    'gemini-pro',
    'gemini-1.0-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-8b'
];

async function testModel(modelName) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say just: OK');
        const text = result.response.text();
        return { model: modelName, status: 'OK', text: text.substring(0, 30) };
    } catch (e) {
        return { model: modelName, status: 'FAIL', error: e.message.substring(0, 80) };
    }
}

async function runTests() {
    console.log('🔎 Testing all known Gemini model names...\n');
    for (const name of modelsToTest) {
        process.stdout.write(`Testing ${name}... `);
        const r = await testModel(name);
        if (r.status === 'OK') {
            console.log(`✅ WORKS! Response: ${r.text}`);
        } else {
            console.log(`❌ FAIL: ${r.error}`);
        }
    }
    process.exit(0);
}

runTests();
