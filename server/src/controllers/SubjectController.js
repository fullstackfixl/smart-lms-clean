const BaseController = require('../core/BaseController');
const Subject = require('../models/Subject');

class SubjectController extends BaseController {
    constructor() {
        super(Subject);
    }

    async create(req, res) {
        req.body.organization_id = req.user.organization_id;
        try {
            const subject = new Subject(req.body);
            await subject.save();
            return res.success(subject, 'Subject created successfully', 201);
        } catch (error) {
            return res.error(error.message);
        }
    }

    async getAll(req, res) {
        try {
            const subjects = await Subject.find({ organization_id: req.user.organization_id }).sort({ name: 1 });
            return res.success(subjects);
        } catch (error) {
            return res.error(error.message);
        }
    }

    async getById(req, res) {
        try {
            const subject = await Subject.findOne({
                _id: req.params.id,
                organization_id: req.user.organization_id
            });
            if (!subject) return res.error('Subject not found', 'Not Found', 404);
            return res.success(subject);
        } catch (error) {
            return res.error(error.message);
        }
    }

    async update(req, res) {
        try {
            const subject = await Subject.findOneAndUpdate(
                { _id: req.params.id, organization_id: req.user.organization_id },
                req.body,
                { new: true, runValidators: true }
            );
            if (!subject) return res.error('Subject not found', 'Not Found', 404);
            return res.success(subject, 'Subject updated successfully');
        } catch (error) {
            return res.error(error.message);
        }
    }

    async delete(req, res) {
        try {
            const subject = await Subject.findOneAndDelete({
                _id: req.params.id,
                organization_id: req.user.organization_id
            });
            if (!subject) return res.error('Subject not found', 'Not Found', 404);
            return res.success(null, 'Subject deleted successfully');
        } catch (error) {
            return res.error(error.message);
        }
    }
}

module.exports = new SubjectController();
