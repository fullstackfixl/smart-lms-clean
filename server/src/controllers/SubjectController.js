const BaseController = require('../core/BaseController');
const Subject = require('../models/Subject');
const academicEnrollmentEngine = require('../services/academicEnrollmentEngine');
const { AcademicEnrollment, Batch, InstructorAssignment } = require('../models');

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

            const enrollments = await AcademicEnrollment.find({
                organizationId,
                studentId: req.user._id
            })
                .populate('subjectId')
                .populate('instructorId', 'name email profile')
                .lean();

            const subjects = enrollments
                .map((e) => {
                    const subject = e.subjectId;
                    if (!subject) return null;
                    return {
                        ...subject,
                        programId: e.programId,
                        batchId: e.batchId,
                        instructor: e.instructorId
                            ? {
                                name: e.instructorId.profile?.fullName || e.instructorId.name,
                                email: e.instructorId.email
                            }
                            : null
                    };
                })
                .filter(Boolean);

            return this.sendSuccess(res, subjects);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async getInstructorSubjects(req, res) {
        try {
            const organizationId = req.user.organization_id?._id || req.user.organization_id;

            const [mappings, legacySubjects] = await Promise.all([
                InstructorAssignment.find({
                    organizationId,
                    instructorId: req.user._id,
                    isActive: true
                })
                    .select('subjectId batchId programId')
                    .lean(),
                // Backward compatible fallback: subjects directly assigned via Subject.instructorId
                Subject.find({
                    organizationId,
                    instructorId: req.user._id,
                    isActive: true
                }).select('_id').lean()
            ]);

            const mappingSubjectIds = mappings.map((m) => m.subjectId).filter(Boolean);
            const legacySubjectIds = legacySubjects.map((s) => s._id);
            const subjectIds = [...new Set([...mappingSubjectIds, ...legacySubjectIds].map(String))].map((id) => id);

            const subjects = subjectIds.length
                ? await Subject.find({ organizationId, _id: { $in: subjectIds }, isActive: true }).lean()
                : [];
            const subjectById = new Map(subjects.map((s) => [String(s._id), s]));

            const batchIds = [...new Set(mappings.map((m) => String(m.batchId)).filter(Boolean))];
            const batches = batchIds.length
                ? await Batch.find({ organizationId, _id: { $in: batchIds }, isActive: true }).select('_id name code year semester').lean()
                : [];
            const batchById = new Map(batches.map((b) => [String(b._id), b]));

            const enrollmentRows = (mappingSubjectIds.length || legacySubjectIds.length)
                ? await AcademicEnrollment.find({
                    organizationId,
                    instructorId: req.user._id,
                    subjectId: { $in: [...new Set([...mappingSubjectIds, ...legacySubjectIds].map(String))] }
                })
                    .select('subjectId batchId studentId')
                    .lean()
                : [];

            // Count students per (subjectId + batchId)
            const studentsByKey = new Map();
            for (const row of enrollmentRows) {
                if (!row.subjectId) continue;
                const sid = String(row.subjectId);
                const bid = row.batchId ? String(row.batchId) : 'null';
                const key = `${sid}:${bid}`;
                const existing = studentsByKey.get(key) || new Set();
                if (row.studentId) existing.add(String(row.studentId));
                studentsByKey.set(key, existing);
            }

            // Build cards: prefer explicit mappings; include legacy subject-level cards once
            const cards = [];

            for (const m of mappings) {
                const subject = subjectById.get(String(m.subjectId));
                if (!subject) continue;
                const bid = m.batchId ? String(m.batchId) : null;
                const key = `${String(subject._id)}:${bid || 'null'}`;
                const set = studentsByKey.get(key);
                const count = set ? set.size : 0;
                cards.push({
                    ...subject,
                    batchId: bid,
                    batch: bid ? (batchById.get(bid) || null) : null,
                    students: count,
                    totalStudents: count
                });
            }

            const mappedSubjectIdSet = new Set(mappings.map((m) => String(m.subjectId)));
            for (const sid of legacySubjectIds.map(String)) {
                if (mappedSubjectIdSet.has(sid)) continue;
                const subject = subjectById.get(sid);
                if (!subject) continue;
                const key = `${sid}:null`;
                const set = studentsByKey.get(key);
                const count = set ? set.size : 0;
                cards.push({
                    ...subject,
                    batchId: subject.batchId || null,
                    batch: subject.batchId ? (batchById.get(String(subject.batchId)) || null) : null,
                    students: count,
                    totalStudents: count
                });
            }

            return this.sendSuccess(res, cards);
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

            try {
                await academicEnrollmentEngine.syncNewSubjectToStudents({ actorUser: req.user, subject });
            } catch (engineErr) {
                // Non-blocking: subject creation must succeed even if sync fails
                console.warn('[SubjectController] syncNewSubjectToStudents failed:', engineErr.message);
            }
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
                .populate('instructorId', 'profile.fullName email')
                .populate('contentCourseId', 'title')
                .sort({ name: 1 });

            return this.sendSuccess(res, subjects);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async getById(req, res) {
        try {
            const organizationId = req.user.organization_id?._id || req.user.organization_id;
            const subject = await Subject.findOne({
                _id: req.params.id,
                organizationId
            });
            if (!subject) return this.sendError(res, 'Subject not found', 404);
            return this.sendSuccess(res, subject);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async update(req, res) {
        try {
            const organizationId = req.user.organization_id?._id || req.user.organization_id;
            const previous = await Subject.findOne({ _id: req.params.id, organizationId }).select('instructorId').lean();
            const subject = await Subject.findOneAndUpdate(
                { _id: req.params.id, organizationId },
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

            const nextInstructorId = subject.instructorId?.toString() || null;
            const prevInstructorId = previous?.instructorId?.toString() || null;
            if (nextInstructorId !== prevInstructorId) {
                try {
                    await academicEnrollmentEngine.syncInstructorChange({
                        actorUser: req.user,
                        subjectId: subject._id,
                        instructorId: subject.instructorId
                    });
                } catch (engineErr) {
                    // Non-blocking
                    console.warn('[SubjectController] syncInstructorChange failed:', engineErr.message);
                }
            }
            return this.sendSuccess(res, subject, 'Subject updated successfully');
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async delete(req, res) {
        try {
            const organizationId = req.user.organization_id?._id || req.user.organization_id;
            const subject = await Subject.findOneAndDelete({
                _id: req.params.id,
                organizationId
            });
            if (!subject) return this.sendError(res, 'Subject not found', 404);
            return this.sendSuccess(res, null, 'Subject deleted successfully');
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }
}

module.exports = new SubjectController();
