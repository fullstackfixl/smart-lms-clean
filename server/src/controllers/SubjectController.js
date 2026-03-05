const BaseController = require('../core/BaseController');
const Subject = require('../models/Subject');

class SubjectController extends BaseController {
    constructor() {
        super(Subject);
        this.create = this.create.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getById = this.getById.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
    }

    async create(req, res) {
        req.body.organization_id = req.user.organization_id;
        try {
            const subject = new Subject(req.body);
            await subject.save();
            return this.sendSuccess(res, subject, 'Subject created successfully', 201);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async getAll(req, res) {
        try {
            const subjects = await Subject.find({ organization_id: req.user.organization_id }).sort({ name: 1 });
            return this.sendSuccess(res, subjects);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async getById(req, res) {
        try {
            const subject = await Subject.findOne({
                _id: req.params.id,
                organization_id: req.user.organization_id
            });
            if (!subject) return this.sendError(res, 'Subject not found', 404);
            return this.sendSuccess(res, subject);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async update(req, res) {
        try {
            const subject = await Subject.findOneAndUpdate(
                { _id: req.params.id, organization_id: req.user.organization_id },
                req.body,
                { new: true, runValidators: true }
            );
            if (!subject) return this.sendError(res, 'Subject not found', 404);
            return this.sendSuccess(res, subject, 'Subject updated successfully');
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async delete(req, res) {
        try {
            const subject = await Subject.findOneAndDelete({
                _id: req.params.id,
                organization_id: req.user.organization_id
            });
            if (!subject) return this.sendError(res, 'Subject not found', 404);
            return this.sendSuccess(res, null, 'Subject deleted successfully');
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }
}

module.exports = new SubjectController();
