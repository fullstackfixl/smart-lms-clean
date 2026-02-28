require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const key = process.env.GEMINI_API_KEY;
console.log('🔑 GEMINI_API_KEY present:', !!key);

if (!key) {
  console.error('❌ GEMINI_API_KEY is missing from .env!');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(key);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' });

    const prompt = `Generate 2 multiple choice questions for medium level based on: JavaScript Closures. Return JSON format:
[
  {
    "question": "",
    "options": ["A","B","C","D"],
    "correctAnswerIndex": 0,
    "explanation": ""
  }
]
IMPORTANT: Return ONLY the JSON array. No markdown, no explanation.`;

    console.log('⏳ Calling Gemini API...');
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log('✅ Raw response received:');
    console.log(text);

    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);
    console.log('\n✨ Parsed successfully. Questions:', parsed.length);
    console.log('First question:', parsed[0].question);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.status) console.error('HTTP Status:', err.status);
    process.exit(1);
  }
}

test();
