const BaseController = require('../core/BaseController');
const Semester = require('../models/Semester');

class SemesterController extends BaseController {
    constructor() {
        super(Semester);
        this.create = this.create.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getById = this.getById.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
    }

    async create(req, res) {
        req.body.organization_id = req.user.organization_id;
        try {
            const semester = new Semester(req.body);
            await semester.save();
            return this.sendSuccess(res, semester, 'Semester created successfully', 201);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async getAll(req, res) {
        try {
            const semesters = await Semester.find({ organization_id: req.user.organization_id }).sort({ number: 1 });
            return this.sendSuccess(res, semesters);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async getById(req, res) {
        try {
            const semester = await Semester.findOne({
                _id: req.params.id,
                organization_id: req.user.organization_id
            });
            if (!semester) return this.sendError(res, 'Semester not found', 404);
            return this.sendSuccess(res, semester);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async update(req, res) {
        try {
            const semester = await Semester.findOneAndUpdate(
                { _id: req.params.id, organization_id: req.user.organization_id },
                req.body,
                { new: true, runValidators: true }
            );
            if (!semester) return this.sendError(res, 'Semester not found', 404);
            return this.sendSuccess(res, semester, 'Semester updated successfully');
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async delete(req, res) {
        try {
            const semester = await Semester.findOneAndDelete({
                _id: req.params.id,
                organization_id: req.user.organization_id
            });
            if (!semester) return this.sendError(res, 'Semester not found', 404);
            return this.sendSuccess(res, null, 'Semester deleted successfully');
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }
}

module.exports = new SemesterController();
