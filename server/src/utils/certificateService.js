const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Organization = require('../models/Organization');
const CourseCompletionService = require('./courseCompletionService');
const CertificateGenerator = require('./certificateGenerator');

/**
 * Certificate Service
 * Handles certificate generation, storage, and management
 */
class CertificateService {

  /**
   * Generate certificate for a completed course
   * @param {string} studentId - Student ID
   * @param {string} courseId - Course ID
   * @param {string} organizationId - Organization ID
   * @param {string} enrollmentId - Enrollment ID
   * @returns {Promise<Object>} Certificate generation result
   */
  static async generateCertificate(studentId, courseId, organizationId, enrollmentId) {
    try {
      // Check certificate eligibility
      const eligibilityCheck = await CourseCompletionService.checkCertificateEligibility(
        studentId,
        courseId,
        organizationId
      );

      if (!eligibilityCheck.eligible) {
        return {
          success: false,
          error: eligibilityCheck.reason,
          details: eligibilityCheck.requirements || eligibilityCheck.existing_certificate
        };
      }

      // Get student and organization details
      const [student, organization] = await Promise.all([
        User.findById(studentId),
        Organization.findById(organizationId)
      ]);

      if (!student || !organization) {
        return {
          success: false,
          error: 'Student or organization not found'
        };
      }

      const completionDetails = eligibilityCheck.completion_details;

      // Create certificate record
      const certificate = new Certificate({
        organization_id: organizationId,
        student_id: studentId,
        course_id: courseId,
        enrollment_id: enrollmentId,
        student_name: student.name || student.full_name,
        course_title: completionDetails.course_title,
        instructor_name: completionDetails.instructor_name,
        organization_name: organization.name,
        completion_date: completionDetails.completion_date,
        final_grade_percentage: completionDetails.final_grade_percentage,
        total_lessons_completed: completionDetails.lessons.completed_count,
        total_quizzes_passed: completionDetails.quizzes.passed_count,
        course_duration_hours: completionDetails.course_duration_hours,
        metadata: {
          course_category: 'General', // Could be enhanced to get from course
          course_level: 'Intermediate', // Could be enhanced to get from course
          organization_logo_url: organization.logo_url,
          additional_notes: `Completed with ${completionDetails.final_grade_percentage}% grade`
        }
      });

      await certificate.save();

      // Generate PDF
      const certificateData = certificate.getCertificateData();
      const pdfResult = await CertificateGenerator.generateAndSaveCertificate(certificateData);

      if (pdfResult.success) {
        // Update certificate with PDF details
        await certificate.markPdfGenerated(pdfResult.file_path, pdfResult.file_url);

        return {
          success: true,
          certificate: {
            id: certificate._id,
            certificate_id: certificate.certificate_id,
            verification_code: certificate.verification_code,
            student_name: certificate.student_name,
            course_title: certificate.course_title,
            issued_date: certificate.issued_date,
            pdf_url: certificate.pdf_file_url,
            final_grade: certificate.final_grade_percentage
          },
          pdf_buffer: pdfResult.pdf_buffer
        };
      } else {
        // Mark PDF generation as failed
        await certificate.markPdfGenerationFailed(pdfResult.error);

        return {
          success: false,
          error: 'PDF generation failed',
          certificate_created: true,
          certificate_id: certificate.certificate_id,
          pdf_error: pdfResult.error
        };
      }

    } catch (error) {
      console.error('Certificate generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's certificates
   * @param {string} studentId - Student ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} User certificates
   */
  static async getUserCertificates(studentId, organizationId) {
    try {
      const certificates = await Certificate.findByStudent(studentId, organizationId)
        .populate('course_id', 'title category')
        .populate('enrollment_id', 'enrolled_at');

      const certificateList = certificates.map(cert => ({
        id: cert._id,
        certificate_id: cert.certificate_id,
        verification_code: cert.verification_code,
        course_title: cert.course_title,
        course_id: cert.course_id._id,
        instructor_name: cert.instructor_name,
        completion_date: cert.completion_date,
        issued_date: cert.issued_date,
        final_grade_percentage: cert.final_grade_percentage,
        pdf_generated: cert.pdf_generated,
        pdf_url: cert.pdf_file_url,
        status: cert.status,
        enrollment_date: cert.enrollment_id?.enrolled_at
      }));

      return {
        success: true,
        certificates: certificateList,
        total_certificates: certificateList.length
      };

    } catch (error) {
      console.error('Get user certificates error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get certificate by ID with access control
   * @param {string} certificateId - Certificate ID
   * @param {string} userId - User ID requesting access
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Certificate details
   */
  static async getCertificateById(certificateId, userId, organizationId) {
    try {
      const certificate = await Certificate.findOne({
        _id: certificateId,
        organization_id: organizationId,
        is_active: true
      }).populate('course_id', 'title')
        .populate('student_id', 'full_name email');

      if (!certificate) {
        return {
          success: false,
          error: 'Certificate not found'
        };
      }

      // Get user for access check
      const user = await User.findById(userId);
      const accessCheck = certificate.canUserAccess(user);

      if (!accessCheck.canAccess) {
        return {
          success: false,
          error: 'Access denied',
          reason: accessCheck.reason
        };
      }

      return {
        success: true,
        certificate: {
          id: certificate._id,
          certificate_id: certificate.certificate_id,
          verification_code: certificate.verification_code,
          student_name: certificate.student_name,
          student_email: certificate.student_id.email,
          course_title: certificate.course_title,
          instructor_name: certificate.instructor_name,
          organization_name: certificate.organization_name,
          completion_date: certificate.completion_date,
          issued_date: certificate.issued_date,
          final_grade_percentage: certificate.final_grade_percentage,
          total_lessons_completed: certificate.total_lessons_completed,
          total_quizzes_passed: certificate.total_quizzes_passed,
          course_duration_hours: certificate.course_duration_hours,
          pdf_generated: certificate.pdf_generated,
          pdf_url: certificate.pdf_file_url,
          status: certificate.status,
          metadata: certificate.metadata
        }
      };

    } catch (error) {
      console.error('Get certificate by ID error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify certificate authenticity
   * @param {string} certificateId - Certificate ID
   * @param {string} verificationCode - Verification code
   * @returns {Promise<Object>} Verification result
   */
  static async verifyCertificate(certificateId, verificationCode) {
    try {
      const certificate = await Certificate.verifyCertificate(certificateId, verificationCode)
        .populate('student_id', 'full_name')
        .populate('course_id', 'title')
        .populate('organization_id', 'name');

      if (!certificate) {
        return {
          success: false,
          verified: false,
          error: 'Certificate not found or verification code invalid'
        };
      }

      // Check if certificate is still valid (not expired)
      const isValid = certificate.status === 'valid';

      return {
        success: true,
        verified: isValid,
        certificate: {
          certificate_id: certificate.certificate_id,
          student_name: certificate.student_name,
          course_title: certificate.course_title,
          organization_name: certificate.organization_name,
          completion_date: certificate.completion_date,
          issued_date: certificate.issued_date,
          final_grade_percentage: certificate.final_grade_percentage,
          status: certificate.status,
          expires_at: certificate.expires_at
        }
      };

    } catch (error) {
      console.error('Certificate verification error:', error);
      return {
        success: false,
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Get course certificates (for instructors/admins)
   * @param {string} courseId - Course ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Course certificates
   */
  static async getCourseCertificates(courseId, organizationId) {
    try {
      const certificates = await Certificate.findByCourse(courseId, organizationId)
        .populate('student_id', 'full_name email')
        .populate('enrollment_id', 'enrolled_at');

      const certificateList = certificates.map(cert => ({
        id: cert._id,
        certificate_id: cert.certificate_id,
        student_name: cert.student_name,
        student_email: cert.student_id.email,
        completion_date: cert.completion_date,
        issued_date: cert.issued_date,
        final_grade_percentage: cert.final_grade_percentage,
        pdf_generated: cert.pdf_generated,
        status: cert.status,
        enrollment_date: cert.enrollment_id?.enrolled_at
      }));

      return {
        success: true,
        certificates: certificateList,
        total_certificates: certificateList.length
      };

    } catch (error) {
      console.error('Get course certificates error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Regenerate certificate PDF
   * @param {string} certificateId - Certificate ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Regeneration result
   */
  static async regenerateCertificatePDF(certificateId, organizationId) {
    try {
      const certificate = await Certificate.findOne({
        _id: certificateId,
        organization_id: organizationId,
        is_active: true
      });

      if (!certificate) {
        return {
          success: false,
          error: 'Certificate not found'
        };
      }

      // Generate new PDF
      const certificateData = certificate.getCertificateData();
      const pdfResult = await CertificateGenerator.generateAndSaveCertificate(certificateData);

      if (pdfResult.success) {
        // Update certificate with new PDF details
        await certificate.markPdfGenerated(pdfResult.file_path, pdfResult.file_url);

        return {
          success: true,
          message: 'Certificate PDF regenerated successfully',
          pdf_url: certificate.pdf_file_url
        };
      } else {
        // Mark PDF generation as failed
        await certificate.markPdfGenerationFailed(pdfResult.error);

        return {
          success: false,
          error: 'PDF regeneration failed',
          pdf_error: pdfResult.error
        };
      }

    } catch (error) {
      console.error('Certificate PDF regeneration error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get organization certificate statistics
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Certificate statistics
   */
  static async getOrganizationCertificateStats(organizationId) {
    try {
      const stats = await Certificate.getOrganizationStats(organizationId);

      return {
        success: true,
        statistics: stats
      };

    } catch (error) {
      console.error('Organization certificate stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Revoke certificate (admin only)
   * @param {string} certificateId - Certificate ID
   * @param {string} organizationId - Organization ID
   * @param {string} reason - Revocation reason
   * @returns {Promise<Object>} Revocation result
   */
  static async revokeCertificate(certificateId, organizationId, reason) {
    try {
      const certificate = await Certificate.findOne({
        _id: certificateId,
        organization_id: organizationId
      });

      if (!certificate) {
        return {
          success: false,
          error: 'Certificate not found'
        };
      }

      certificate.is_active = false;
      certificate.metadata.revocation_reason = reason;
      certificate.metadata.revoked_at = new Date();

      await certificate.save();

      return {
        success: true,
        message: 'Certificate revoked successfully'
      };

    } catch (error) {
      console.error('Certificate revocation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CertificateService;