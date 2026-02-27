const BaseController = require('../core/BaseController');
const User = require('../models/User');

class TrainerController extends BaseController {
    async list(req, res) {
        try {
            const trainers = await User.find({
                organization_id: req.user.organization_id,
                role: 'instructor',
                is_deleted: { $ne: true }
            }).select('-password_hash');
            return this.sendSuccess(res, trainers);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async updateExpertise(req, res) {
        try {
            const { id } = req.params;
            const { expertise, bio } = req.body;
            const trainer = await User.findOneAndUpdate(
                { _id: id, organization_id: req.user.organization_id, role: 'instructor' },
                { $set: { 'profile.expertise': expertise, 'profile.bio': bio } },
                { new: true }
            );
            if (!trainer) return this.sendError(res, 'Trainer not found', 144);
            return this.sendSuccess(res, trainer, 'Trainer profile updated');
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }
}

module.exports = new TrainerController();
