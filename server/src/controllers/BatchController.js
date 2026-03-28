const BaseController = require('../core/BaseController');
const Batch = require('../models/Batch');

class BatchController extends BaseController {
    constructor() {
        super(Batch);
    }

    async create(req, res) {
        req.body.organizationId = req.user.organization_id?._id || req.user.organization_id;
        try {
            const batch = new Batch(req.body);
            await batch.save();
            return res.success(batch, 'Batch created successfully', 201);
        } catch (error) {
            return res.error(error.message);
        }
    }

    async getAll(req, res) {
        try {
            const orgId = req.user.organization_id?._id || req.user.organization_id;
            const batches = await Batch.find({ organizationId: orgId }).sort({ name: 1 });
            return res.success(batches);
        } catch (error) {
            return res.error(error.message);
        }
    }

    async getById(req, res) {
        try {
            const orgId = req.user.organization_id?._id || req.user.organization_id;
            const batch = await Batch.findOne({
                _id: req.params.id,
                organizationId: orgId
            });
            if (!batch) return res.error('Batch not found', 'Not Found', 404);
            return res.success(batch);
        } catch (error) {
            return res.error(error.message);
        }
    }

    async update(req, res) {
        try {
            const orgId = req.user.organization_id?._id || req.user.organization_id;
            const batch = await Batch.findOneAndUpdate(
                { _id: req.params.id, organizationId: orgId },
                req.body,
                { new: true, runValidators: true }
            );
            if (!batch) return res.error('Batch not found', 'Not Found', 404);
            return res.success(batch, 'Batch updated successfully');
        } catch (error) {
            return res.error(error.message);
        }
    }

    async delete(req, res) {
        try {
            const orgId = req.user.organization_id?._id || req.user.organization_id;
            const batch = await Batch.findOneAndDelete({
                _id: req.params.id,
                organizationId: orgId
            });
            if (!batch) return res.error('Batch not found', 'Not Found', 404);
            return res.success(null, 'Batch deleted successfully');
        } catch (error) {
            return res.error(error.message);
        }
    }
}

module.exports = new BatchController();
