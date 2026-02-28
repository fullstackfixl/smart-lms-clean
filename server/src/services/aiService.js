const BaseService = require('../core/BaseService');
const Groq = require('groq-sdk');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const QuizResult = require('../models/QuizResult');
const LessonChat = require('../models/LessonChat');
const logger = require('../utils/logger');

class AIService extends BaseService {
  constructor() {
    super();
    this.groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
    this.GROQ_MODEL = 'llama-3.3-70b-versatile';
  }

  async askLessonQuestion(userId, lessonId, message, organizationId) {
    try {
      if (!this.groq) {
        throw new Error('AI Service not configured: GROQ_API_KEY is missing');
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
      const systemMsg = `You are a helpful AI tutor for Smart LMS. Focus on being a trust-worthy assistant. Avoid using markdown headers like # or ##. Use bold text for emphasis.
Lesson Title: "${lesson.title}"
Lesson Content: "${lessonText}"
Student's Quiz Performance for this lesson: "${scoreText}"`;

      const userMsg = `The student has asked: "${message}"

Please explain simply with examples. Be professional, encouraging, and concise. 
If the student's score is low (under 60%), provide extra clarity and break down concepts further.
Return only the helpful explanation.`;

      // 5. Generate AI Response
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: userMsg }
        ],
        model: this.GROQ_MODEL,
        temperature: 0.5,
        max_tokens: 1024,
      });
      const aiResponse = completion.choices[0]?.message?.content || "I am currently unable to answer your question.";

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

  async generateAIQuiz(prompt, numberOfQuestions, difficulty, courseId, organizationId) {
    const safePrompt = prompt.replace(/[<>]/g, '').substring(0, 500);

    const systemPrompt = `You are a professional quiz generation API. You ONLY output valid JSON.
Return an object with a "questions" key containing an array of multiple choice questions.
Match this exact schema for each question:
{
  "question": "The question text",
  "options": ["A", "B", "C", "D"],
  "correct_answer": 0,
  "explanation": "Brief explanation"
}
Difficulty: ${difficulty}. Topic focus: ${safePrompt}.`;

    const userPrompt = `Generate ${numberOfQuestions} multiple choice questions.`;

    if (!this.groq) {
      throw new Error('No AI provider configured. Set GROQ_API_KEY in .env');
    }

    try {
      logger.info(`[AI:Groq] Generating ${numberOfQuestions} questions for: ${safePrompt}`);
      const completion = await this.groq.chat.completions.create({
        model: this.GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' }
      });

      const text = completion.choices[0].message.content.trim();
      const parsed = JSON.parse(text);

      let questions = parsed.questions || parsed.quiz || (Array.isArray(parsed) ? parsed : null);

      if (!questions && typeof parsed === 'object') {
        const firstKey = Object.keys(parsed)[0];
        if (Array.isArray(parsed[firstKey])) questions = parsed[firstKey];
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Could not find question array in AI response');
      }

      logger.info(`[AI:Groq] Successfully generated ${questions.length} questions`);
      return this._formatQuestions(questions);

    } catch (err) {
      logger.error('[AI:Groq] Failed to generate quiz:', err.message);
      throw new Error('AI quiz generation failed: ' + err.message);
    }
  }

  // Normalize questions from any AI provider to DB schema
  _formatQuestions(questions) {
    return questions.map(q => ({
      question: q.question || q.text || '',
      options: Array.isArray(q.options) ? q.options : [],
      correct_answer: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex
        : typeof q.correctIndex === 'number' ? q.correctIndex
          : typeof q.answer === 'number' ? q.answer : 0,
      explanation: q.explanation || q.rationale || ''
    }));
  }


  async generateQuiz(topicData) {
    const prompt = topicData.prompt || topicData.topic || 'General knowledge';
    const count = topicData.numberOfQuestions || 5;
    const difficulty = topicData.difficulty || 'medium';

    const questions = await this.generateAIQuiz(prompt, count, difficulty);

    return {
      title: `AI Generated: ${prompt.substring(0, 30)}`,
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
