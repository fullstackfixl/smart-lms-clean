const BaseController = require('../core/BaseController');
const StudentCourseEnrollment = require('../models/StudentCourseEnrollment');
const StudentSubjectEnrollment = require('../models/StudentSubjectEnrollment');
const User = require('../models/User');
const Subject = require('../models/Subject');

class AcademicEnrollmentController extends BaseController {
    constructor() {
        super(StudentCourseEnrollment);
    }

    /**
     * Enroll student in a Program and Semester
     */
    async enrollInProgram(req, res) {
        try {
            const { studentId, programId, semester, departmentId } = req.body;
            const organizationId = req.user.organization_id?._id || req.user.organization_id;

            console.log(`[AcademicEnrollment] Input: student=${studentId}, program=${programId}, sem=${semester}, org=${organizationId}`);

            // 1. Update Student Profile
            const student = await User.findOne({ _id: studentId, organization_id: organizationId });
            if (!student) {
                console.error(`[AcademicEnrollment] Student not found: ${studentId} in org ${organizationId}`);
                return this.sendError(res, 'Student not found', 404);
            }

            console.log(`[AcademicEnrollment] Student found: ${student.name}. Updating profile...`);
            student.profile = student.profile || {};
            student.profile.program_id = programId;
            student.profile.current_semester = semester;
            student.profile.department = departmentId;
            await student.save();

            // 2. Create or Update Course Enrollment
            console.log(`[AcademicEnrollment] Upserting StudentCourseEnrollment...`);
            const courseEnrollment = await StudentCourseEnrollment.findOneAndUpdate(
                { studentId, courseId: programId, organizationId },
                { studentId, courseId: programId, departmentId, semester, organizationId },
                { upsert: true, new: true, runValidators: true }
            );

            // 3. Auto-enroll in Subjects of this semester
            console.log(`[AcademicEnrollment] Finding subjects for program ${programId}, sem ${semester}...`);
            const subjects = await Subject.find({
                program_id: programId,
                semester: semester,
                organization_id: organizationId
            });
            console.log(`[AcademicEnrollment] Found ${subjects.length} subjects.`);

            const subjectEnrollments = await Promise.all(subjects.map(subject => {
                return StudentSubjectEnrollment.findOneAndUpdate(
                    { studentId, subjectId: subject._id, organizationId },
                    {
                        studentId,
                        subjectId: subject._id,
                        courseId: programId,
                        departmentId,
                        semester,
                        organizationId
                    },
                    { upsert: true, new: true, runValidators: true }
                );
            }));

            console.log(`[AcademicEnrollment] Enrollment successful.`);
            return this.sendSuccess(res, { courseEnrollment, subjectEnrollmentsCount: subjectEnrollments.length }, 'Student enrolled in program and subjects successfully');
        } catch (error) {
            console.error(`[AcademicEnrollment] CRITICAL ERROR:`, error);
            return this.sendError(res, `Course enrollment failed: ${error.message}`);
        }
    }

    /**
     * Get Student Academic Profile (Current Program/Semester)
     */
    async getStudentAcademicProfile(req, res) {
        try {
            const studentId = req.params.studentId || req.user._id;
            const organizationId = req.user.organization_id?._id || req.user.organization_id;

            const student = await User.findOne({ _id: studentId, organization_id: organizationId })
                .populate('profile.program_id', 'name code');

            if (!student) return this.sendError(res, 'Student not found', 404);

            const enrollments = await StudentSubjectEnrollment.find({ studentId, organizationId })
                .populate('subjectId', 'name code semester');

            return this.sendSuccess(res, {
                profile: student.profile,
                enrollments
            });
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }
}

module.exports = new AcademicEnrollmentController();
