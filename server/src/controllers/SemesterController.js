const BaseController = require('../core/BaseController');
const Semester = require('../models/Semester');

class SemesterController extends BaseController {
    constructor() {
        super(Semester);
    }

    async create(req, res) {
        req.body.organization_id = req.user.organization_id;
        try {
            const semester = new Semester(req.body);
            await semester.save();
            return res.success(semester, 'Semester created successfully', 201);
        } catch (error) {
            return res.error(error.message);
        }
    }

    async getAll(req, res) {
        try {
            const semesters = await Semester.find({ organization_id: req.user.organization_id }).sort({ number: 1 });
            return res.success(semesters);
        } catch (error) {
            return res.error(error.message);
        }
    }

    async getById(req, res) {
        try {
            const semester = await Semester.findOne({
                _id: req.params.id,
                organization_id: req.user.organization_id
            });
            if (!semester) return res.error('Semester not found', 'Not Found', 404);
            return res.success(semester);
        } catch (error) {
            return res.error(error.message);
        }
    }

    async update(req, res) {
        try {
            const semester = await Semester.findOneAndUpdate(
                { _id: req.params.id, organization_id: req.user.organization_id },
                req.body,
                { new: true, runValidators: true }
            );
            if (!semester) return res.error('Semester not found', 'Not Found', 404);
            return res.success(semester, 'Semester updated successfully');
        } catch (error) {
            return res.error(error.message);
        }
    }

    async delete(req, res) {
        try {
            const semester = await Semester.findOneAndDelete({
                _id: req.params.id,
                organization_id: req.user.organization_id
            });
            if (!semester) return res.error('Semester not found', 'Not Found', 404);
            return res.success(null, 'Semester deleted successfully');
        } catch (error) {
            return res.error(error.message);
        }
    }
}

module.exports = new SemesterController();
