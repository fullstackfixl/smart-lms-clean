const BaseController = require('../core/BaseController');
const GamificationPoints = require('../models/GamificationPoints');
const UserBadge = require('../models/UserBadge');
const User = require('../models/User');

class LeaderboardController extends BaseController {
    async getGlobalLeaderboard(req, res) {
        try {
            // Aggregate points by student in this organization
            const leaderboard = await GamificationPoints.aggregate([
                { $match: { organization_id: req.user.organization_id } },
                {
                    $group: {
                        _id: '$user_id',
                        totalPoints: { $sum: '$points' }
                    }
                },
                { $sort: { totalPoints: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $project: {
                        name: '$user.name',
                        email: '$user.email',
                        totalPoints: 1,
                        profilePic: '$user.profile.pic_url'
                    }
                }
            ]);
            return this.sendSuccess(res, leaderboard);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async getUserBadges(req, res) {
        try {
            const badges = await UserBadge.find({
                organization_id: req.user.organization_id,
                user_id: req.params.userId
            });
            return this.sendSuccess(res, badges);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }
}

module.exports = new LeaderboardController();
