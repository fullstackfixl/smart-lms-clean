const BaseController = require('../core/BaseController');
const AcademicYear = require('../models/AcademicYear');

class AcademicYearController extends BaseController {
    constructor() {
        super(AcademicYear);
    }

    async create(req, res) {
        req.body.organization_id = req.user.organization_id;
        try {
            const year = new AcademicYear(req.body);
            await year.save();
            return res.success(year, 'Academic Year created successfully', 201);
        } catch (error) {
            return res.error(error.message);
        }
    }

    async getAll(req, res) {
        try {
            const years = await AcademicYear.find({ organization_id: req.user.organization_id }).sort({ start_date: -1 });
            return res.success(years);
        } catch (error) {
            return res.error(error.message);
        }
    }

    async getById(req, res) {
        try {
            const year = await AcademicYear.findOne({
                _id: req.params.id,
                organization_id: req.user.organization_id
            });
            if (!year) return res.error('Academic Year not found', 'Not Found', 404);
            return res.success(year);
        } catch (error) {
            return res.error(error.message);
        }
    }

    async update(req, res) {
        try {
            const year = await AcademicYear.findOneAndUpdate(
                { _id: req.params.id, organization_id: req.user.organization_id },
                req.body,
                { new: true, runValidators: true }
            );
            if (!year) return res.error('Academic Year not found', 'Not Found', 404);
            return res.success(year, 'Academic Year updated successfully');
        } catch (error) {
            return res.error(error.message);
        }
    }

    async delete(req, res) {
        try {
            const year = await AcademicYear.findOneAndDelete({
                _id: req.params.id,
                organization_id: req.user.organization_id
            });
            if (!year) return res.error('Academic Year not found', 'Not Found', 404);
            return res.success(null, 'Academic Year deleted successfully');
        } catch (error) {
            return res.error(error.message);
        }
    }
}

module.exports = new AcademicYearController();
