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
        this.getInstructorSubjects = this.getInstructorSubjects.bind(this);
        this.getStudentSubjects = this.getStudentSubjects.bind(this);
    }

    async getStudentSubjects(req, res) {
        try {
            const organizationId = req.user.organization_id?._id || req.user.organization_id;
            const { program_id, current_semester } = req.user.profile || {};

            if (!program_id || !current_semester) {
                return this.sendSuccess(res, [], 'No academic program or semester assigned');
            }

            const subjects = await Subject.find({
                program_id,
                semester: current_semester,
                organization_id: organizationId
            }).populate('instructor_id', 'name email profile');

            return this.sendSuccess(res, subjects);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async getInstructorSubjects(req, res) {
        try {
            const organizationId = req.user.organization_id?._id || req.user.organization_id;
            const subjects = await Subject.find({
                instructor_id: req.user._id,
                organization_id: organizationId
            }).populate('program_id', 'name code');

            return this.sendSuccess(res, subjects);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async create(req, res) {
        try {
            const organizationId = req.user.organization_id?._id || req.user.organization_id;

            const mapped = {
                ...req.body,
                organizationId,
                departmentId: req.body.departmentId || req.body.department_id,
                programId: req.body.programId || req.body.program_id,
                instructorId: req.body.instructorId || req.body.instructor_id,
                semester: req.body.semester ?? req.body.semesterNumber ?? req.body.semester_id,
                code: (req.body.code || '').toString().trim().toUpperCase()
            };

            delete mapped.organization_id;
            delete mapped.department_id;
            delete mapped.program_id;
            delete mapped.instructor_id;
            delete mapped.semester_id;

            const subject = new Subject(mapped);
            await subject.save();
            return this.sendSuccess(res, subject, 'Subject created successfully', 201);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async getAll(req, res) {
        try {
            const { program_id } = req.query;
            const organizationId = req.user.organization_id?._id || req.user.organization_id;
            const query = { organizationId };
            if (program_id) query.programId = program_id;

            const subjects = await Subject.find(query)
                .populate('instructor_id', 'profile.fullName email')
                .populate('contentCourseId', 'title')
                .sort({ name: 1 });

            return this.sendSuccess(res, subjects);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async getById(req, res) {
        try {
            const subject = await Subject.findOne({
                _id: req.params.id,
                organizationId: req.user.organization_id
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
                { _id: req.params.id, organizationId: req.user.organization_id },
                {
                    ...req.body,
                    departmentId: req.body.departmentId || req.body.department_id,
                    programId: req.body.programId || req.body.program_id,
                    instructorId: req.body.instructorId || req.body.instructor_id,
                    semester: req.body.semester ?? req.body.semesterNumber ?? req.body.semester_id,
                    code: req.body.code ? String(req.body.code).trim().toUpperCase() : undefined
                },
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
                organizationId: req.user.organization_id
            });
            if (!subject) return this.sendError(res, 'Subject not found', 404);
            return this.sendSuccess(res, null, 'Subject deleted successfully');
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }
}

module.exports = new SubjectController();
