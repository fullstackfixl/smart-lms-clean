const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const mongoose = require('mongoose');
const QuestionBank = require('../models/QuestionBank');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create question bank (instructor/admin only)
router.post('/', requireRole(['instructor', 'org_admin']), async (req, res) => {
  try {
    const { title, description, courseId, category, difficulty, tags, questions, isPublic } = req.body;
    const organizationId = req.user.organization_id;

    if (!title || !courseId || !questions || questions.length === 0) {
      return res.error('Title, course ID, and questions are required', 'Validation failed', 400);
    }

    const questionBank = new QuestionBank({
      title,
      description,
      course_id: courseId,
      organization_id: organizationId,
      created_by: req.user._id,
      category: category || 'general',
      difficulty: difficulty || 'medium',
      tags: tags || [],
      questions,
      is_public: isPublic || false
    });

    await questionBank.save();
    await questionBank.populate([
      { path: 'created_by', select: 'profile.fullName email' },
      { path: 'course_id', select: 'title' }
    ]);

    res.success({ questionBank }, 'Question bank created successfully');

  } catch (error) {
    console.error('Create question bank error:', error);
    res.error(error.message, 'Failed to create question bank', 500);
  }
});

// Get all question banks for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { category, difficulty, search } = req.query;
    const organizationId = req.user.organization_id;

    const query = {
      course_id: courseId,
      organization_id: organizationId
    };

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const questionBanks = await QuestionBank.find(query)
      .populate('created_by', 'profile.fullName email')
      .populate('course_id', 'title')
      .sort({ createdAt: -1 });

    res.success({ questionBanks }, 'Question banks retrieved successfully');

  } catch (error) {
    console.error('Get question banks error:', error);
    res.error(error.message, 'Failed to fetch question banks', 500);
  }
});

// Get single question bank
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organization_id;

    const questionBank = await QuestionBank.findOne({
      _id: id,
      organization_id: organizationId
    })
      .populate('created_by', 'profile.fullName email')
      .populate('course_id', 'title');

    if (!questionBank) {
      return res.error('Question bank not found', 'Not found', 404);
    }

    res.success({ questionBank }, 'Question bank retrieved successfully');

  } catch (error) {
    console.error('Get question bank error:', error);
    res.error(error.message, 'Failed to fetch question bank', 500);
  }
});

// Get random questions from bank
router.post('/:id/random', async (req, res) => {
  try {
    const { id } = req.params;
    const { count = 10, difficulty, tags } = req.body;
    const organizationId = req.user.organization_id;

    const questionBank = await QuestionBank.findOne({
      _id: id,
      organization_id: organizationId
    });

    if (!questionBank) {
      return res.error('Question bank not found', 'Not found', 404);
    }

    let questions = questionBank.questions;

    // Filter by difficulty
    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      questions = questions.filter(q => 
        q.tags && q.tags.some(tag => tags.includes(tag))
      );
    }

    // Shuffle and select random questions
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    // Increment usage count
    questionBank.usage_count += 1;
    await questionBank.save();

    res.success({ questions: selected }, 'Random questions retrieved successfully');

  } catch (error) {
    console.error('Get random questions error:', error);
    res.error(error.message, 'Failed to get random questions', 500);
  }
});

// Update question bank
router.put('/:id', requireRole(['instructor', 'org_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, difficulty, tags, questions, isPublic } = req.body;
    const organizationId = req.user.organization_id;

    const questionBank = await QuestionBank.findOne({
      _id: id,
      organization_id: organizationId
    });

    if (!questionBank) {
      return res.error('Question bank not found', 'Not found', 404);
    }

    // Only creator or admin can edit
    if (questionBank.created_by.toString() !== req.user._id.toString() && req.user.role !== 'org_admin') {
      return res.error('Unauthorized', 'You can only edit your own question banks', 403);
    }

    if (title) questionBank.title = title;
    if (description) questionBank.description = description;
    if (category) questionBank.category = category;
    if (difficulty) questionBank.difficulty = difficulty;
    if (tags) questionBank.tags = tags;
    if (questions) questionBank.questions = questions;
    if (isPublic !== undefined) questionBank.is_public = isPublic;

    await questionBank.save();

    res.success({ questionBank }, 'Question bank updated successfully');

  } catch (error) {
    console.error('Update question bank error:', error);
    res.error(error.message, 'Failed to update question bank', 500);
  }
});

// Add questions to bank
router.post('/:id/questions', requireRole(['instructor', 'org_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;
    const organizationId = req.user.organization_id;

    if (!questions || questions.length === 0) {
      return res.error('Questions are required', 'Validation failed', 400);
    }

    const questionBank = await QuestionBank.findOne({
      _id: id,
      organization_id: organizationId
    });

    if (!questionBank) {
      return res.error('Question bank not found', 'Not found', 404);
    }

    questionBank.questions.push(...questions);
    await questionBank.save();

    res.success({ questionBank }, 'Questions added successfully');

  } catch (error) {
    console.error('Add questions error:', error);
    res.error(error.message, 'Failed to add questions', 500);
  }
});

// Delete question from bank
router.delete('/:id/questions/:questionIndex', requireRole(['instructor', 'org_admin']), async (req, res) => {
  try {
    const { id, questionIndex } = req.params;
    const organizationId = req.user.organization_id;

    const questionBank = await QuestionBank.findOne({
      _id: id,
      organization_id: organizationId
    });

    if (!questionBank) {
      return res.error('Question bank not found', 'Not found', 404);
    }

    const index = parseInt(questionIndex);
    if (index < 0 || index >= questionBank.questions.length) {
      return res.error('Invalid question index', 'Validation failed', 400);
    }

    questionBank.questions.splice(index, 1);
    await questionBank.save();

    res.success({ questionBank }, 'Question deleted successfully');

  } catch (error) {
    console.error('Delete question error:', error);
    res.error(error.message, 'Failed to delete question', 500);
  }
});

// Delete question bank
router.delete('/:id', requireRole(['instructor', 'org_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organization_id;

    const questionBank = await QuestionBank.findOne({
      _id: id,
      organization_id: organizationId
    });

    if (!questionBank) {
      return res.error('Question bank not found', 'Not found', 404);
    }

    // Only creator or admin can delete
    if (questionBank.created_by.toString() !== req.user._id.toString() && req.user.role !== 'org_admin') {
      return res.error('Unauthorized', 'You can only delete your own question banks', 403);
    }

    await questionBank.deleteOne();

    res.success({}, 'Question bank deleted successfully');

  } catch (error) {
    console.error('Delete question bank error:', error);
    res.error(error.message, 'Failed to delete question bank', 500);
  }
});

// Duplicate question bank
router.post('/:id/duplicate', requireRole(['instructor', 'org_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organization_id;

    const originalBank = await QuestionBank.findOne({
      _id: id,
      organization_id: organizationId
    });

    if (!originalBank) {
      return res.error('Question bank not found', 'Not found', 404);
    }

    const duplicateBank = new QuestionBank({
      title: `${originalBank.title} (Copy)`,
      description: originalBank.description,
      course_id: originalBank.course_id,
      organization_id: organizationId,
      created_by: req.user._id,
      category: originalBank.category,
      difficulty: originalBank.difficulty,
      tags: originalBank.tags,
      questions: originalBank.questions,
      is_public: false
    });

    await duplicateBank.save();

    res.success({ questionBank: duplicateBank }, 'Question bank duplicated successfully');

  } catch (error) {
    console.error('Duplicate question bank error:', error);
    res.error(error.message, 'Failed to duplicate question bank', 500);
  }
});

// Get statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organization_id;

    const questionBank = await QuestionBank.findOne({
      _id: id,
      organization_id: organizationId
    });

    if (!questionBank) {
      return res.error('Question bank not found', 'Not found', 404);
    }

    const stats = {
      totalQuestions: questionBank.questions.length,
      byType: {},
      byDifficulty: {
        easy: 0,
        medium: 0,
        hard: 0
      },
      averagePoints: 0,
      usageCount: questionBank.usage_count
    };

    let totalPoints = 0;

    questionBank.questions.forEach(q => {
      // Count by type
      stats.byType[q.question_type] = (stats.byType[q.question_type] || 0) + 1;

      // Count by difficulty
      if (q.difficulty) {
        stats.byDifficulty[q.difficulty]++;
      }

      // Sum points
      totalPoints += q.points || 1;
    });

    stats.averagePoints = stats.totalQuestions > 0 
      ? (totalPoints / stats.totalQuestions).toFixed(2)
      : 0;

    res.success({ statistics: stats }, 'Statistics retrieved successfully');

  } catch (error) {
    console.error('Get statistics error:', error);
    res.error(error.message, 'Failed to get statistics', 500);
  }
});

module.exports = router;
