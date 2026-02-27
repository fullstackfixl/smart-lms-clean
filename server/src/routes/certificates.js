const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');
const CertificateService = require('../utils/certificateService');
const moduleGuard = require('../middleware/moduleGuard');
const router = express.Router();

// Apply module guard to all certificate routes
router.use(auth, moduleGuard('CERTIFICATES'));

// POST /api/certificates/generate/:enrollmentId - Generate certificate for completed course
router.post('/generate/:enrollmentId', auth, [
  param('enrollmentId').isMongoId().withMessage('Valid enrollment ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid enrollment ID'
      });
    }

    // Only students can generate their own certificates
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only students can generate certificates'
      });
    }

    // Verify enrollment belongs to the user
    const Enrollment = require('../models/Enrollment');
    const enrollment = await Enrollment.findOne({
      _id: req.params.enrollmentId,
      student_id: req.user._id,
      organization_id: req.user.organization_id,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found',
        message: 'Enrollment not found or access denied'
      });
    }

    const result = await CertificateService.generateCertificate(
      req.user._id,
      enrollment.course_id,
      req.user.organization_id,
      enrollment._id
    );

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.certificate,
        message: 'Certificate generated successfully'
      });
    } else {
      const statusCode = result.certificate_created ? 500 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.error,
        details: result.details
      });
    }

  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to generate certificate'
    });
  }
});

// GET /api/certificates - Get user's certificates
router.get('/', auth, async (req, res) => {
  try {
    const result = await CertificateService.getUserCertificates(
      req.user._id,
      req.user.organization_id
    );

    if (result.success) {
      res.json({
        success: true,
        data: {
          certificates: result.certificates,
          total_certificates: result.total_certificates
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to fetch certificates'
      });
    }

  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch certificates'
    });
  }
});

// GET /api/certificates/:id - Get certificate details
router.get('/:id', auth, [
  param('id').isMongoId().withMessage('Valid certificate ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid certificate ID'
      });
    }

    const result = await CertificateService.getCertificateById(
      req.params.id,
      req.user._id,
      req.user.organization_id
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.certificate
      });
    } else {
      const statusCode = result.error === 'Certificate not found' ? 404 : 403;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch certificate'
    });
  }
});

// GET /api/certificates/:id/download - Download certificate PDF
router.get('/:id/download', auth, [
  param('id').isMongoId().withMessage('Valid certificate ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid certificate ID'
      });
    }

    const result = await CertificateService.getCertificateById(
      req.params.id,
      req.user._id,
      req.user.organization_id
    );

    if (!result.success) {
      const statusCode = result.error === 'Certificate not found' ? 404 : 403;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.error
      });
    }

    const certificate = result.certificate;

    if (!certificate.pdf_generated || !certificate.pdf_url) {
      return res.status(404).json({
        success: false,
        error: 'PDF not available',
        message: 'Certificate PDF has not been generated yet'
      });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate_${certificate.certificate_id}.pdf"`);

    // Serve the PDF file
    const path = require('path');
    const fs = require('fs');

    const filePath = path.join(__dirname, '../../uploads/certificates', path.basename(certificate.pdf_url));

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({
        success: false,
        error: 'File not found',
        message: 'Certificate PDF file not found on server'
      });
    }

  } catch (error) {
    console.error('Certificate download error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to download certificate'
    });
  }
});

// GET /api/certificates/verify/:certificateId/:verificationCode - Verify certificate authenticity
router.get('/verify/:certificateId/:verificationCode', [
  param('certificateId').notEmpty().withMessage('Certificate ID is required'),
  param('verificationCode').notEmpty().withMessage('Verification code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Certificate ID and verification code are required'
      });
    }

    const result = await CertificateService.verifyCertificate(
      req.params.certificateId,
      req.params.verificationCode
    );

    if (result.success) {
      res.json({
        success: true,
        verified: result.verified,
        data: result.certificate
      });
    } else {
      res.status(400).json({
        success: false,
        verified: false,
        error: result.error,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Certificate verification error:', error);
    res.status(500).json({
      success: false,
      verified: false,
      error: error.message,
      message: 'Failed to verify certificate'
    });
  }
});

// GET /api/certificates/course/:courseId - Get certificates for a course (instructor/admin only)
router.get('/course/:courseId', auth, [
  param('courseId').isMongoId().withMessage('Valid course ID is required')
], async (req, res) => {
  try {
    // Only instructors and admins can view course certificates
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only instructors and administrators can view course certificates'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid course ID'
      });
    }

    // Verify course belongs to user's organization
    const Course = require('../models/Course');
    const course = await Course.findOne({
      _id: req.params.courseId,
      organization_id: req.user.organization_id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
        message: 'Course not found or access denied'
      });
    }

    const result = await CertificateService.getCourseCertificates(
      req.params.courseId,
      req.user.organization_id
    );

    if (result.success) {
      res.json({
        success: true,
        data: {
          course_title: course.title,
          certificates: result.certificates,
          total_certificates: result.total_certificates
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to fetch course certificates'
      });
    }

  } catch (error) {
    console.error('Get course certificates error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch course certificates'
    });
  }
});

// POST /api/certificates/:id/regenerate - Regenerate certificate PDF (admin only)
router.post('/:id/regenerate', auth, [
  param('id').isMongoId().withMessage('Valid certificate ID is required')
], async (req, res) => {
  try {
    // Only admins can regenerate certificates
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can regenerate certificates'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid certificate ID'
      });
    }

    const result = await CertificateService.regenerateCertificatePDF(
      req.params.id,
      req.user.organization_id
    );

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          pdf_url: result.pdf_url
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Certificate regeneration error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to regenerate certificate'
    });
  }
});

// GET /api/certificates/stats/organization - Get organization certificate statistics (admin only)
router.get('/stats/organization', auth, async (req, res) => {
  try {
    // Only admins can view organization statistics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can view organization statistics'
      });
    }

    const result = await CertificateService.getOrganizationCertificateStats(
      req.user.organization_id
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.statistics
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to fetch certificate statistics'
      });
    }

  } catch (error) {
    console.error('Certificate statistics error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch certificate statistics'
    });
  }
});

// DELETE /api/certificates/:id/revoke - Revoke certificate (admin only)
router.delete('/:id/revoke', auth, [
  param('id').isMongoId().withMessage('Valid certificate ID is required'),
  body('reason').notEmpty().withMessage('Revocation reason is required')
], async (req, res) => {
  try {
    // Only admins can revoke certificates
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can revoke certificates'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Valid certificate ID and revocation reason are required',
        details: errors.array()
      });
    }

    const result = await CertificateService.revokeCertificate(
      req.params.id,
      req.user.organization_id,
      req.body.reason
    );

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      const statusCode = result.error === 'Certificate not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Certificate revocation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to revoke certificate'
    });
  }
});

module.exports = router;