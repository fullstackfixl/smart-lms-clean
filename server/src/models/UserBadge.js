const mongoose = require('mongoose');

// Badge definitions with point thresholds
const BADGE_DEFINITIONS = {
  getting_started: {
    name: 'Getting Started',
    description: 'Earned your first 100 points',
    points_required: 100,
    icon: 'star',
    color: '#10B981'
  },
  dedicated_learner: {
    name: 'Dedicated Learner',
    description: 'Reached 500 points through consistent learning',
    points_required: 500,
    icon: 'trophy',
    color: '#F59E0B'
  },
  master_student: {
    name: 'Master Student',
    description: 'Achieved 1000 points - true dedication to learning',
    points_required: 1000,
    icon: 'crown',
    color: '#8B5CF6'
  }
};

const userBadgeSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  badge_type: {
    type: String,
    required: true,
    enum: Object.keys(BADGE_DEFINITIONS),
    index: true
  },
  badge_name: {
    type: String,
    required: true
  },
  badge_description: {
    type: String,
    required: true
  },
  points_at_unlock: {
    type: Number,
    required: true,
    min: 0
  },
  earned_at: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  metadata: {
    icon: String,
    color: String,
    unlock_activity_type: String,
    unlock_activity_title: String,
    additional_data: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound indexes for efficient queries
userBadgeSchema.index({ organization_id: 1, user_id: 1 });
userBadgeSchema.index({ user_id: 1, earned_at: -1 });
userBadgeSchema.index({ organization_id: 1, badge_type: 1 });

// Unique constraint to prevent duplicate badges
userBadgeSchema.index({ user_id: 1, badge_type: 1 }, { unique: true });

// Virtual for badge definition
userBadgeSchema.virtual('badge_definition').get(function() {
  return BADGE_DEFINITIONS[this.badge_type];
});

// Static method to get badge definitions
userBadgeSchema.statics.getBadgeDefinitions = function() {
  return BADGE_DEFINITIONS;
};

// Static method to check and unlock badges for user
userBadgeSchema.statics.checkAndUnlockBadges = async function(userId, organizationId, currentPoints) {
  const unlockedBadges = [];
  
  try {
    // Get user's existing badges
    const existingBadges = await this.find({
      user_id: userId,
      organization_id: organizationId,
      is_active: true
    });
    
    const existingBadgeTypes = existingBadges.map(badge => badge.badge_type);
    
    // Check each badge definition
    for (const [badgeType, definition] of Object.entries(BADGE_DEFINITIONS)) {
      // Skip if user already has this badge
      if (existingBadgeTypes.includes(badgeType)) {
        continue;
      }
      
      // Check if user has enough points for this badge
      if (currentPoints >= definition.points_required) {
        const newBadge = new this({
          organization_id: organizationId,
          user_id: userId,
          badge_type: badgeType,
          badge_name: definition.name,
          badge_description: definition.description,
          points_at_unlock: currentPoints,
          metadata: {
            icon: definition.icon,
            color: definition.color
          }
        });
        
        await newBadge.save();
        unlockedBadges.push(newBadge);
      }
    }
    
    return {
      success: true,
      unlocked_badges: unlockedBadges,
      badges_count: unlockedBadges.length
    };
    
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate badge - ignore silently
      return {
        success: true,
        unlocked_badges: [],
        badges_count: 0
      };
    }
    throw error;
  }
};

// Static method to get user's badges
userBadgeSchema.statics.getUserBadges = async function(userId, organizationId) {
  const badges = await this.find({
    user_id: userId,
    organization_id: organizationId,
    is_active: true
  }).sort({ earned_at: -1 });
  
  return badges.map(badge => ({
    ...badge.toObject(),
    badge_definition: BADGE_DEFINITIONS[badge.badge_type]
  }));
};

// Static method to get user's badge progress
userBadgeSchema.statics.getUserBadgeProgress = async function(userId, organizationId, currentPoints) {
  const userBadges = await this.find({
    user_id: userId,
    organization_id: organizationId,
    is_active: true
  });
  
  const earnedBadgeTypes = userBadges.map(badge => badge.badge_type);
  const progress = [];
  
  for (const [badgeType, definition] of Object.entries(BADGE_DEFINITIONS)) {
    const isEarned = earnedBadgeTypes.includes(badgeType);
    const earnedBadge = userBadges.find(badge => badge.badge_type === badgeType);
    
    progress.push({
      badge_type: badgeType,
      badge_name: definition.name,
      badge_description: definition.description,
      points_required: definition.points_required,
      points_progress: Math.min(currentPoints, definition.points_required),
      progress_percentage: Math.min(100, Math.round((currentPoints / definition.points_required) * 100)),
      is_earned: isEarned,
      earned_at: earnedBadge ? earnedBadge.earned_at : null,
      points_remaining: isEarned ? 0 : Math.max(0, definition.points_required - currentPoints),
      metadata: {
        icon: definition.icon,
        color: definition.color
      }
    });
  }
  
  return progress.sort((a, b) => a.points_required - b.points_required);
};

// Static method to get next badge for user
userBadgeSchema.statics.getNextBadge = async function(userId, organizationId, currentPoints) {
  const userBadges = await this.find({
    user_id: userId,
    organization_id: organizationId,
    is_active: true
  });
  
  const earnedBadgeTypes = userBadges.map(badge => badge.badge_type);
  
  // Find the next badge to unlock
  let nextBadge = null;
  let minPointsRequired = Infinity;
  
  for (const [badgeType, definition] of Object.entries(BADGE_DEFINITIONS)) {
    if (!earnedBadgeTypes.includes(badgeType) && definition.points_required > currentPoints) {
      if (definition.points_required < minPointsRequired) {
        minPointsRequired = definition.points_required;
        nextBadge = {
          badge_type: badgeType,
          badge_name: definition.name,
          badge_description: definition.description,
          points_required: definition.points_required,
          points_remaining: definition.points_required - currentPoints,
          progress_percentage: Math.round((currentPoints / definition.points_required) * 100),
          metadata: {
            icon: definition.icon,
            color: definition.color
          }
        };
      }
    }
  }
  
  return nextBadge;
};

// Static method to get organization badge statistics
userBadgeSchema.statics.getOrganizationBadgeStats = async function(organizationId) {
  const stats = await this.aggregate([
    {
      $match: {
        organization_id: new mongoose.Types.ObjectId(organizationId),
        is_active: true
      }
    },
    {
      $group: {
        _id: '$badge_type',
        count: { $sum: 1 },
        avg_points_at_unlock: { $avg: '$points_at_unlock' },
        latest_unlock: { $max: '$earned_at' }
      }
    }
  ]);
  
  const badgeStats = {};
  Object.keys(BADGE_DEFINITIONS).forEach(badgeType => {
    badgeStats[badgeType] = {
      badge_name: BADGE_DEFINITIONS[badgeType].name,
      points_required: BADGE_DEFINITIONS[badgeType].points_required,
      users_earned: 0,
      avg_points_at_unlock: 0,
      latest_unlock: null
    };
  });
  
  stats.forEach(stat => {
    badgeStats[stat._id] = {
      ...badgeStats[stat._id],
      users_earned: stat.count,
      avg_points_at_unlock: Math.round(stat.avg_points_at_unlock),
      latest_unlock: stat.latest_unlock
    };
  });
  
  return badgeStats;
};

// Static method to get recent badge unlocks for organization
userBadgeSchema.statics.getRecentBadgeUnlocks = async function(organizationId, limit = 10) {
  return this.find({
    organization_id: organizationId,
    is_active: true
  })
  .sort({ earned_at: -1 })
  .limit(limit)
  .populate('user_id', 'full_name email')
  .lean();
};

// Pre-save middleware to validate organization consistency
userBadgeSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Verify user belongs to same organization
      const User = mongoose.model('User');
      const user = await User.findById(this.user_id);
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      if (user.organization_id.toString() !== this.organization_id.toString()) {
        return next(new Error('User must belong to the same organization'));
      }
      
      // Validate badge type
      if (!BADGE_DEFINITIONS[this.badge_type]) {
        return next(new Error('Invalid badge type'));
      }
      
      // Set badge details from definition if not provided
      const definition = BADGE_DEFINITIONS[this.badge_type];
      if (!this.badge_name) {
        this.badge_name = definition.name;
      }
      if (!this.badge_description) {
        this.badge_description = definition.description;
      }
      if (!this.metadata.icon) {
        this.metadata.icon = definition.icon;
      }
      if (!this.metadata.color) {
        this.metadata.color = definition.color;
      }
      
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

const UserBadge = mongoose.model('UserBadge', userBadgeSchema);

module.exports = UserBadge;