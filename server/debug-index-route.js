const aiController = require('./src/controllers/aiController');
const { authMiddleware, requireRole } = require('./src/middleware/auth');

console.log('aiController type:', typeof aiController);
console.log('aiController keys:', Object.keys(aiController));
console.log('aiController.generateQuiz type:', typeof aiController.generateQuiz);
console.log('authMiddleware type:', typeof authMiddleware);
console.log('requireRole type:', typeof requireRole);

const router = require('express').Router();
console.log('Testing router.post with aiController.generateQuiz...');
try {
    router.post('/test', authMiddleware, aiController.generateQuiz);
    console.log('✅ router.post worked in isolation');
} catch (e) {
    console.error('❌ router.post failed in isolation:', e.message);
}
