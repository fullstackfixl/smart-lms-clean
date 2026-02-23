const BaseService = require('../core/BaseService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const QuizResult = require('../models/QuizResult');
const LessonChat = require('../models/LessonChat');
const logger = require('../utils/logger');

class AIService extends BaseService {
  constructor() {
    super();
    this.genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
  }

  async askLessonQuestion(userId, lessonId, message, organizationId) {
    try {
      if (!this.genAI) {
        throw new Error('AI Service not configured: GEMINI_API_KEY is missing');
      }

      // 1. Verify student enrolled in course
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) throw new Error('Lesson not found');

      const enrollment = await Enrollment.findOne({
        student_id: userId,
        course_id: lesson.course_id,
        organization_id: organizationId,
        status: { $in: ['active', 'completed'] }
      });

      if (!enrollment) {
        throw new Error('Access denied: Student is not enrolled in this course');
      }

      // 2. Fetch lesson content (trim to 2000 chars)
      let lessonText = lesson.content?.textContent || lesson.description || lesson.title;
      lessonText = lessonText.substring(0, 2000);

      // 3. Fetch student performance/score
      const bestQuiz = await QuizResult.findOne({
        user_id: userId,
        lecture_id: lessonId,
        organization_id: organizationId
      }).sort({ score: -1 });

      const scoreText = bestQuiz ? `${bestQuiz.score}%` : 'not attempted yet';

      // 4. Build prompt
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are a helpful AI tutor for Smart LMS. 
Lesson Title: "${lesson.title}"
Lesson Content: "${lessonText}"
Student's Quiz Performance for this lesson: "${scoreText}"

The student has asked: "${message}"

Please explain simply with examples. Be professional, encouraging, and concise. 
If the student's score is low (under 60%), provide extra clarity and break down concepts further.
Focus on being a trust-worthy assistant. Avoid using markdown headers like # or ##. Use bold text for emphasis.
Return only the helpful explanation.`;

      // 5. Generate AI Response
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      // 6. Save chat to history
      const chatRecord = await LessonChat.create({
        user_id: userId,
        lesson_id: lessonId,
        message,
        ai_response: aiResponse,
        organization_id: organizationId
      });

      // 7. Log instructor alert for low performance if message implies struggle
      if (bestQuiz && bestQuiz.score < 50) {
        logger.info(`[AI Tutor Warning] Student ${userId} struggling with Lesson ${lessonId} (Score: ${bestQuiz.score}%). AI Response generated.`);
      }

      return {
        ai_response: aiResponse,
        created_at: chatRecord.created_at
      };

    } catch (error) {
      logger.error('AIService askLessonQuestion error:', error);
      throw error;
    }
  }

  async getLessonChatHistory(userId, lessonId, organizationId) {
    try {
      const chats = await LessonChat.find({
        user_id: userId,
        lesson_id: lessonId,
        organization_id: organizationId
      })
        .sort({ created_at: 1 })
        .select('message ai_response created_at');

      return chats;
    } catch (error) {
      logger.error('AIService getLessonChatHistory error:', error);
      throw error;
    }
  }

  async generateQuiz(topicData) {
    // ... existing mock logic ...
    const questions = [
      {
        question_text: `What is ${topicData.topic}?`,
        type: 'multiple_choice',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: 'Option A',
        points: 10
      }
    ];

    return {
      title: `Quiz on ${topicData.topic}`,
      questions,
      generated_at: new Date()
    };
  }

  async explainTopic(topicData) {
    // ... existing mock logic ...
    return {
      topic: topicData.topic,
      explanation: `This is an AI-generated explanation for ${topicData.topic}. The topic covers fundamental concepts and practical applications.`,
      level: topicData.level || 'beginner'
    };
  }

  async predictPerformance(userId, courseId, organizationId) {
    // ... existing mock logic ...
    return {
      user_id: userId,
      course_id: courseId,
      predicted_score: 85,
      confidence: 0.75,
      recommendations: ['Focus on practice exercises', 'Review module 3']
    };
  }
}

module.exports = new AIService();
