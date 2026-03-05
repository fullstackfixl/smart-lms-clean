const BaseController = require('../core/BaseController');
const AcademicRecord = require('../models/AcademicRecord');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Semester = require('../models/Semester');

class CollegeAcademicController extends BaseController {
    constructor() {
        super(AcademicRecord);
    }

    /**
     * Get Gradebook for a course
     * Only for COLLEGE instructors
     */
    async getGradebook(req, res) {
        try {
            const { courseId } = req.params;
            const organizationId = req.user.organization_id?._id || req.user.organization_id;

            // Verify course belongs to org
            const course = await Course.findOne({ _id: courseId, organization_id: organizationId });
            if (!course) return this.sendError(res, 'Course not found', 404);

            // Get enrolled students
            const enrollments = await Enrollment.find({
                course_id: courseId,
                organization_id: organizationId,
                status: 'active'
            }).populate('student_id', 'name email profile');

            // Get existing academic records for this course
            const records = await AcademicRecord.find({
                course_id: courseId,
                organization_id: organizationId
            });

            const gradebook = enrollments.map(enr => {
                const record = records.find(r => r.student_id.toString() === enr.student_id._id.toString());
                return {
                    student: enr.student_id,
                    record: record || { internal_marks: 0, exam_marks: 0, total: 0, grade: 'I' }
                };
            });

            return this.sendSuccess(res, { course, gradebook });
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    /**
     * Update or Create Marks
     */
    async updateMarks(req, res) {
        try {
            const { studentId, courseId, semesterId, internal_marks, exam_marks, credits } = req.body;
            const organizationId = req.user.organization_id?._id || req.user.organization_id;

            console.log(`[Academic] Updating marks for student: ${studentId}, course: ${courseId}, org: ${organizationId}`);

            let record = await AcademicRecord.findOne({
                student_id: studentId,
                course_id: courseId,
                organization_id: organizationId
            });

            if (!record) {
                console.log(`[Academic] Creating new record for student: ${studentId}`);
                record = new AcademicRecord({
                    student_id: studentId,
                    course_id: courseId,
                    organization_id: organizationId
                });
            }

            record.semester_id = semesterId;
            record.internal_marks = Number(internal_marks) || 0;
            record.exam_marks = Number(exam_marks) || 0;
            record.credits = Number(credits) || 0;

            await record.save();
            console.log(`[Academic] Record saved. Total: ${record.total}, Grade: ${record.grade}`);

            // Sync with GradeSummary for GPA Reports
            try {
                const GradeSummary = require('../models/GradeSummary');
                await GradeSummary.findOneAndUpdate(
                    { organization_id: organizationId, course_id: courseId, student_id: studentId },
                    {
                        current_percentage: record.total,
                        letter_grade: record.grade,
                        grade_points: record.gpa_points,
                        last_updated: new Date(),
                        is_active: true
                    },
                    { upsert: true }
                );
            } catch (syncErr) {
                console.error('Failed to sync GradeSummary:', syncErr);
            }

            return this.sendSuccess(res, record, 'Marks updated successfully');
        } catch (error) {
            console.error('[Academic] Error in updateMarks:', error);
            return this.sendError(res, error.message);
        }
    }

    /**
     * Get Academic Transcript for a student
     */
    async getTranscript(req, res) {
        try {
            const studentId = req.params.studentId || req.user._id;
            const organizationId = req.user.organization_id?._id || req.user.organization_id;

            const records = await AcademicRecord.find({
                student_id: studentId,
                organization_id: organizationId
            })
                .populate('course_id', 'title course_credits')
                .populate('semester_id', 'name number')
                .sort({ 'semester_id.number': 1 });

            // Group by semester
            const semesters = {};
            let totalQualityPoints = 0;
            let totalCredits = 0;

            records.forEach(rec => {
                const semName = rec.semester_id?.name || 'Unknown';
                if (!semesters[semName]) {
                    semesters[semName] = { name: semName, number: rec.semester_id?.number, courses: [], sgpa: 0, semCredits: 0, semQP: 0 };
                }

                semesters[semName].courses.push(rec);
                semesters[semName].semCredits += rec.credits;
                semesters[semName].semQP += (rec.gpa_points * rec.credits);

                totalCredits += rec.credits;
                totalQualityPoints += (rec.gpa_points * rec.credits);
            });

            // Calculate SGPA per semester
            Object.keys(semesters).forEach(key => {
                const sem = semesters[key];
                sem.sgpa = sem.semCredits > 0 ? (sem.semQP / sem.semCredits).toFixed(2) : 0;
            });

            const cgpa = totalCredits > 0 ? (totalQualityPoints / totalCredits).toFixed(2) : 0;

            return this.sendSuccess(res, {
                studentId,
                semesters: Object.values(semesters),
                cgpa,
                totalCredits
            });
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    /**
     * Get All Semesters for an organization
     */
    async getSemesters(req, res) {
        try {
            const organizationId = req.user.organization_id?._id || req.user.organization_id;
            const semesters = await Semester.find({ organization_id: organizationId }).sort({ number: 1 });
            return this.sendSuccess(res, semesters);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }
}

module.exports = new CollegeAcademicController();
