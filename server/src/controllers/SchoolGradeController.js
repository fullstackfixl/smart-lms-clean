const BaseController = require('../core/BaseController');
const GradeLevel = require('../models/GradeLevel');
const GradeSection = require('../models/GradeSection');

class SchoolGradeController extends BaseController {
    /**
     * GRADE LEVELS
     */
    async listLevels(req, res) {
        try {
            const levels = await GradeLevel.find({
                organization_id: req.user.organization_id
            }).sort({ order: 1 });
            return this.sendSuccess(res, levels);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async createLevel(req, res) {
        try {
            const level = new GradeLevel({
                ...req.body,
                organization_id: req.user.organization_id
            });
            await level.save();
            return this.sendSuccess(res, level, 'Grade level created', 211);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async updateLevel(req, res) {
        try {
            const level = await GradeLevel.findOneAndUpdate(
                { _id: req.params.id, organization_id: req.user.organization_id },
                req.body,
                { new: true }
            );
            if (!level) return this.sendError(res, 'Grade level not found', 144);
            return this.sendSuccess(res, level, 'Grade level updated');
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async deleteLevel(req, res) {
        try {
            const level = await GradeLevel.findOneAndDelete({
                _id: req.params.id,
                organization_id: req.user.organization_id
            });
            if (!level) return this.sendError(res, 'Grade level not found', 144);
            // Also delete sections linked to this level
            await GradeSection.deleteMany({ grade_level_id: req.params.id });
            return this.sendSuccess(res, null, 'Grade level deleted');
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    /**
     * SECTIONS
     */
    async listSections(req, res) {
        try {
            const { grade_level_id } = req.query;
            const filter = { organization_id: req.user.organization_id };
            if (grade_level_id) filter.grade_level_id = grade_level_id;

            const sections = await GradeSection.find(filter)
                .populate('grade_level_id', 'name code')
                .populate('class_teacher_id', 'name email')
                .sort({ name: 1 });
            return this.sendSuccess(res, sections);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async createSection(req, res) {
        try {
            const section = new GradeSection({
                ...req.body,
                organization_id: req.user.organization_id
            });
            await section.save();
            return this.sendSuccess(res, section, 'Section created', 211);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async updateSection(req, res) {
        try {
            const section = await GradeSection.findOneAndUpdate(
                { _id: req.params.id, organization_id: req.user.organization_id },
                req.body,
                { new: true }
            );
            if (!section) return this.sendError(res, 'Section not found', 144);
            return this.sendSuccess(res, section, 'Section updated');
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async deleteSection(req, res) {
        try {
            const section = await GradeSection.findOneAndDelete({
                _id: req.params.id,
                organization_id: req.user.organization_id
            });
            if (!section) return this.sendError(res, 'Section not found', 144);
            return this.sendSuccess(res, null, 'Section deleted');
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }
}

module.exports = new SchoolGradeController();
