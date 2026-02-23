const mongoose = require('mongoose');

const lessonChatSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    lesson_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    ai_response: {
        type: String,
        required: true
    },
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound index for faster history retrieval
lessonChatSchema.index({ user_id: 1, lesson_id: 1, created_at: -1 });

module.exports = mongoose.model('LessonChat', lessonChatSchema);
