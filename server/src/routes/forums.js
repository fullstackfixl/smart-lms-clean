const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const mongoose = require('mongoose');
const Forum = require('../models/Forum');
const ForumReply = require('../models/ForumReply');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create forum thread
router.post('/', async (req, res) => {
  try {
    const { title, description, courseId, category, tags } = req.body;
    const organizationId = req.user.organization_id;

    if (!title || !courseId) {
      return res.error('Title and course ID are required', 'Validation failed', 400);
    }

    const forum = new Forum({
      title,
      description,
      course_id: courseId,
      organization_id: organizationId,
      created_by: req.user._id,
      category: category || 'general',
      tags: tags || []
    });

    await forum.save();
    await forum.populate([
      { path: 'created_by', select: 'profile.fullName email' },
      { path: 'course_id', select: 'title' }
    ]);

    res.success({ forum }, 'Forum thread created successfully');

  } catch (error) {
    console.error('Create forum error:', error);
    res.error(error.message, 'Failed to create forum thread', 500);
  }
});

// Get all forums for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { category, search, page = 1, limit = 20 } = req.query;
    const organizationId = req.user.organization_id;

    const query = {
      course_id: courseId,
      organization_id: organizationId
    };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const forums = await Forum.find(query)
      .populate('created_by', 'profile.fullName email profile.avatar')
      .populate('course_id', 'title')
      .sort({ is_pinned: -1, last_activity: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Forum.countDocuments(query);

    res.success({
      forums,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Forums retrieved successfully');

  } catch (error) {
    console.error('Get forums error:', error);
    res.error(error.message, 'Failed to fetch forums', 500);
  }
});

// Get single forum thread with replies
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organization_id;

    const forum = await Forum.findOne({
      _id: id,
      organization_id: organizationId
    })
      .populate('created_by', 'profile.fullName email profile.avatar')
      .populate('course_id', 'title');

    if (!forum) {
      return res.error('Forum not found', 'Not found', 404);
    }

    // Increment view count
    forum.views += 1;
    await forum.save();

    // Get replies
    const replies = await ForumReply.find({
      forum_id: id,
      organization_id: organizationId
    })
      .populate('author_id', 'profile.fullName email profile.avatar')
      .populate('parent_reply_id')
      .sort({ createdAt: 1 });

    res.success({
      forum,
      replies
    }, 'Forum thread retrieved successfully');

  } catch (error) {
    console.error('Get forum error:', error);
    res.error(error.message, 'Failed to fetch forum thread', 500);
  }
});

// Add reply to forum
router.post('/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parentReplyId, attachments } = req.body;
    const organizationId = req.user.organization_id;

    if (!content) {
      return res.error('Content is required', 'Validation failed', 400);
    }

    // Verify forum exists and is not locked
    const forum = await Forum.findOne({
      _id: id,
      organization_id: organizationId
    });

    if (!forum) {
      return res.error('Forum not found', 'Not found', 404);
    }

    if (forum.is_locked) {
      return res.error('Forum is locked', 'Cannot reply to locked forum', 403);
    }

    const reply = new ForumReply({
      forum_id: id,
      parent_reply_id: parentReplyId || null,
      content,
      author_id: req.user._id,
      organization_id: organizationId,
      attachments: attachments || []
    });

    await reply.save();

    // Update forum stats
    forum.replies_count += 1;
    forum.last_activity = new Date();
    await forum.save();

    await reply.populate('author_id', 'profile.fullName email profile.avatar');

    res.success({ reply }, 'Reply added successfully');

  } catch (error) {
    console.error('Add reply error:', error);
    res.error(error.message, 'Failed to add reply', 500);
  }
});

// Like/Unlike reply
router.post('/reply/:replyId/like', async (req, res) => {
  try {
    const { replyId } = req.params;
    const organizationId = req.user.organization_id;

    const reply = await ForumReply.findOne({
      _id: replyId,
      organization_id: organizationId
    });

    if (!reply) {
      return res.error('Reply not found', 'Not found', 404);
    }

    const userIndex = reply.likes.indexOf(req.user._id);

    if (userIndex > -1) {
      // Unlike
      reply.likes.splice(userIndex, 1);
    } else {
      // Like
      reply.likes.push(req.user._id);
    }

    await reply.save();

    res.success({
      likes: reply.likes.length,
      isLiked: userIndex === -1
    }, 'Like status updated');

  } catch (error) {
    console.error('Like reply error:', error);
    res.error(error.message, 'Failed to update like status', 500);
  }
});

// Mark reply as solution
router.post('/reply/:replyId/mark-solution', async (req, res) => {
  try {
    const { replyId } = req.params;
    const organizationId = req.user.organization_id;

    const reply = await ForumReply.findOne({
      _id: replyId,
      organization_id: organizationId
    }).populate('forum_id');

    if (!reply) {
      return res.error('Reply not found', 'Not found', 404);
    }

    // Only thread creator or instructor can mark solution
    const forum = reply.forum_id;
    if (forum.created_by.toString() !== req.user._id.toString() && req.user.role !== 'instructor') {
      return res.error('Unauthorized', 'Only thread creator or instructor can mark solution', 403);
    }

    // Unmark other solutions in this thread
    await ForumReply.updateMany(
      { forum_id: forum._id, _id: { $ne: replyId } },
      { is_solution: false }
    );

    reply.is_solution = true;
    await reply.save();

    res.success({ reply }, 'Reply marked as solution');

  } catch (error) {
    console.error('Mark solution error:', error);
    res.error(error.message, 'Failed to mark solution', 500);
  }
});

// Update forum thread
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, tags } = req.body;
    const organizationId = req.user.organization_id;

    const forum = await Forum.findOne({
      _id: id,
      organization_id: organizationId
    });

    if (!forum) {
      return res.error('Forum not found', 'Not found', 404);
    }

    // Only creator or instructor can edit
    if (forum.created_by.toString() !== req.user._id.toString() && req.user.role !== 'instructor') {
      return res.error('Unauthorized', 'You can only edit your own threads', 403);
    }

    if (title) forum.title = title;
    if (description) forum.description = description;
    if (category) forum.category = category;
    if (tags) forum.tags = tags;

    await forum.save();

    res.success({ forum }, 'Forum thread updated successfully');

  } catch (error) {
    console.error('Update forum error:', error);
    res.error(error.message, 'Failed to update forum thread', 500);
  }
});

// Delete forum thread
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organization_id;

    const forum = await Forum.findOne({
      _id: id,
      organization_id: organizationId
    });

    if (!forum) {
      return res.error('Forum not found', 'Not found', 404);
    }

    // Only creator or instructor can delete
    if (forum.created_by.toString() !== req.user._id.toString() && req.user.role !== 'instructor') {
      return res.error('Unauthorized', 'You can only delete your own threads', 403);
    }

    // Delete all replies
    await ForumReply.deleteMany({ forum_id: id });

    // Delete forum
    await forum.deleteOne();

    res.success({}, 'Forum thread deleted successfully');

  } catch (error) {
    console.error('Delete forum error:', error);
    res.error(error.message, 'Failed to delete forum thread', 500);
  }
});

// Pin/Unpin forum (instructor only)
router.post('/:id/pin', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organization_id;

    if (req.user.role !== 'instructor' && req.user.role !== 'org_admin') {
      return res.error('Unauthorized', 'Only instructors can pin threads', 403);
    }

    const forum = await Forum.findOne({
      _id: id,
      organization_id: organizationId
    });

    if (!forum) {
      return res.error('Forum not found', 'Not found', 404);
    }

    forum.is_pinned = !forum.is_pinned;
    await forum.save();

    res.success({ forum }, `Forum thread ${forum.is_pinned ? 'pinned' : 'unpinned'} successfully`);

  } catch (error) {
    console.error('Pin forum error:', error);
    res.error(error.message, 'Failed to pin forum thread', 500);
  }
});

// Lock/Unlock forum (instructor only)
router.post('/:id/lock', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organization_id;

    if (req.user.role !== 'instructor' && req.user.role !== 'org_admin') {
      return res.error('Unauthorized', 'Only instructors can lock threads', 403);
    }

    const forum = await Forum.findOne({
      _id: id,
      organization_id: organizationId
    });

    if (!forum) {
      return res.error('Forum not found', 'Not found', 404);
    }

    forum.is_locked = !forum.is_locked;
    await forum.save();

    res.success({ forum }, `Forum thread ${forum.is_locked ? 'locked' : 'unlocked'} successfully`);

  } catch (error) {
    console.error('Lock forum error:', error);
    res.error(error.message, 'Failed to lock forum thread', 500);
  }
});

module.exports = router;
