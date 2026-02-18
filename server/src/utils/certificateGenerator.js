const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

/**
 * Certificate Generator Service
 * Handles PDF certificate creation with organization branding
 */
class CertificateGenerator {

  /**
   * Generate a certificate PDF
   * @param {Object} certificateData - Certificate data
   * @returns {Promise<Buffer>} PDF buffer
   */
  static async generateCertificatePDF(certificateData) {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Add a page (A4 landscape)
      const page = pdfDoc.addPage([842, 595]); // A4 landscape dimensions
      
      // Get fonts
      const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      
      // Define colors
      const primaryColor = rgb(0.2, 0.4, 0.8); // Blue
      const secondaryColor = rgb(0.4, 0.4, 0.4); // Gray
      const accentColor = rgb(0.8, 0.6, 0.2); // Gold
      
      // Page dimensions
      const { width, height } = page.getSize();
      const margin = 50;
      
      // Draw border
      page.drawRectangle({
        x: margin - 10,
        y: margin - 10,
        width: width - 2 * (margin - 10),
        height: height - 2 * (margin - 10),
        borderColor: primaryColor,
        borderWidth: 3,
      });
      
      // Inner decorative border
      page.drawRectangle({
        x: margin + 10,
        y: margin + 10,
        width: width - 2 * (margin + 10),
        height: height - 2 * (margin + 10),
        borderColor: accentColor,
        borderWidth: 1,
      });
      
      // Title: "Certificate of Completion"
      const titleText = 'CERTIFICATE OF COMPLETION';
      const titleSize = 36;
      const titleWidth = titleFont.widthOfTextAtSize(titleText, titleSize);
      
      page.drawText(titleText, {
        x: (width - titleWidth) / 2,
        y: height - 120,
        size: titleSize,
        font: titleFont,
        color: primaryColor,
      });
      
      // Decorative line under title
      page.drawLine({
        start: { x: (width - titleWidth) / 2, y: height - 135 },
        end: { x: (width + titleWidth) / 2, y: height - 135 },
        thickness: 2,
        color: accentColor,
      });
      
      // "This is to certify that"
      const certifyText = 'This is to certify that';
      const certifySize = 16;
      const certifyWidth = bodyFont.widthOfTextAtSize(certifyText, certifySize);
      
      page.drawText(certifyText, {
        x: (width - certifyWidth) / 2,
        y: height - 180,
        size: certifySize,
        font: bodyFont,
        color: secondaryColor,
      });
      
      // Student name (large, prominent)
      const studentName = certificateData.student_name;
      const nameSize = 32;
      const nameWidth = titleFont.widthOfTextAtSize(studentName, nameSize);
      
      page.drawText(studentName, {
        x: (width - nameWidth) / 2,
        y: height - 230,
        size: nameSize,
        font: titleFont,
        color: primaryColor,
      });
      
      // Underline for name
      page.drawLine({
        start: { x: (width - nameWidth) / 2 - 20, y: height - 245 },
        end: { x: (width + nameWidth) / 2 + 20, y: height - 245 },
        thickness: 1,
        color: secondaryColor,
      });
      
      // "has successfully completed the course"
      const completedText = 'has successfully completed the course';
      const completedSize = 16;
      const completedWidth = bodyFont.widthOfTextAtSize(completedText, completedSize);
      
      page.drawText(completedText, {
        x: (width - completedWidth) / 2,
        y: height - 280,
        size: completedSize,
        font: bodyFont,
        color: secondaryColor,
      });
      
      // Course title (prominent)
      const courseTitle = certificateData.course_title;
      const courseTitleSize = 24;
      const courseTitleWidth = titleFont.widthOfTextAtSize(courseTitle, courseTitleSize);
      
      page.drawText(courseTitle, {
        x: (width - courseTitleWidth) / 2,
        y: height - 320,
        size: courseTitleSize,
        font: titleFont,
        color: accentColor,
      });
      
      // Course details
      const detailsY = height - 370;
      const detailsSize = 12;
      
      // Completion date
      const completionDate = new Date(certificateData.completion_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const completionText = `Completed on: ${completionDate}`;
      page.drawText(completionText, {
        x: margin + 50,
        y: detailsY,
        size: detailsSize,
        font: bodyFont,
        color: secondaryColor,
      });
      
      // Final grade
      const gradeText = `Final Grade: ${certificateData.final_grade_percentage}%`;
      page.drawText(gradeText, {
        x: margin + 50,
        y: detailsY - 20,
        size: detailsSize,
        font: bodyFont,
        color: secondaryColor,
      });
      
      // Course statistics
      const statsText = `Lessons Completed: ${certificateData.total_lessons_completed} | Quizzes Passed: ${certificateData.total_quizzes_passed}`;
      page.drawText(statsText, {
        x: margin + 50,
        y: detailsY - 40,
        size: detailsSize,
        font: bodyFont,
        color: secondaryColor,
      });
      
      // Organization name
      const orgText = certificateData.organization_name;
      const orgSize = 18;
      const orgWidth = titleFont.widthOfTextAtSize(orgText, orgSize);
      
      page.drawText(orgText, {
        x: (width - orgWidth) / 2,
        y: margin + 120,
        size: orgSize,
        font: titleFont,
        color: primaryColor,
      });
      
      // Instructor signature area
      const signatureY = margin + 80;
      
      // Instructor name
      const instructorText = certificateData.instructor_name;
      page.drawText(instructorText, {
        x: width - margin - 200,
        y: signatureY,
        size: 14,
        font: bodyFont,
        color: secondaryColor,
      });
      
      // Instructor title
      page.drawText('Course Instructor', {
        x: width - margin - 200,
        y: signatureY - 15,
        size: 10,
        font: italicFont,
        color: secondaryColor,
      });
      
      // Signature line
      page.drawLine({
        start: { x: width - margin - 200, y: signatureY - 5 },
        end: { x: width - margin - 50, y: signatureY - 5 },
        thickness: 1,
        color: secondaryColor,
      });
      
      // Issue date
      const issueDate = new Date(certificateData.issued_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      page.drawText(`Issued: ${issueDate}`, {
        x: margin + 50,
        y: signatureY,
        size: 12,
        font: bodyFont,
        color: secondaryColor,
      });
      
      // Certificate ID (bottom right)
      const certIdText = `Certificate ID: ${certificateData.certificate_id}`;
      const certIdSize = 8;
      const certIdWidth = bodyFont.widthOfTextAtSize(certIdText, certIdSize);
      
      page.drawText(certIdText, {
        x: width - margin - certIdWidth,
        y: margin + 20,
        size: certIdSize,
        font: bodyFont,
        color: secondaryColor,
      });
      
      // Verification code (bottom left)
      const verificationText = `Verification: ${certificateData.verification_code}`;
      page.drawText(verificationText, {
        x: margin + 50,
        y: margin + 20,
        size: 8,
        font: bodyFont,
        color: secondaryColor,
      });
      
      // Course duration (if available)
      if (certificateData.course_duration_hours) {
        const durationText = `Course Duration: ${certificateData.course_duration_hours} hours`;
        page.drawText(durationText, {
          x: margin + 50,
          y: detailsY - 60,
          size: detailsSize,
          font: bodyFont,
          color: secondaryColor,
        });
      }
      
      // Serialize the PDF document to bytes
      const pdfBytes = await pdfDoc.save();
      
      return Buffer.from(pdfBytes);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`Failed to generate certificate PDF: ${error.message}`);
    }
  }

  /**
   * Save certificate PDF to file system
   * @param {Buffer} pdfBuffer - PDF buffer
   * @param {string} certificateId - Certificate ID for filename
   * @returns {Promise<Object>} File path and URL
   */
  static async saveCertificatePDF(pdfBuffer, certificateId) {
    try {
      // Create certificates directory if it doesn't exist
      const certificatesDir = path.join(__dirname, '../../uploads/certificates');
      
      try {
        await fs.access(certificatesDir);
      } catch {
        await fs.mkdir(certificatesDir, { recursive: true });
      }
      
      // Generate filename
      const filename = `certificate_${certificateId}_${Date.now()}.pdf`;
      const filePath = path.join(certificatesDir, filename);
      
      // Save file
      await fs.writeFile(filePath, pdfBuffer);
      
      // Generate URL (relative to uploads directory)
      const fileUrl = `/uploads/certificates/${filename}`;
      
      return {
        success: true,
        file_path: filePath,
        file_url: fileUrl,
        filename: filename
      };
      
    } catch (error) {
      console.error('Certificate save error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate and save certificate
   * @param {Object} certificateData - Certificate data
   * @returns {Promise<Object>} Generation result
   */
  static async generateAndSaveCertificate(certificateData) {
    try {
      // Generate PDF
      const pdfBuffer = await this.generateCertificatePDF(certificateData);
      
      // Save PDF
      const saveResult = await this.saveCertificatePDF(pdfBuffer, certificateData.certificate_id);
      
      if (saveResult.success) {
        return {
          success: true,
          pdf_buffer: pdfBuffer,
          file_path: saveResult.file_path,
          file_url: saveResult.file_url,
          filename: saveResult.filename
        };
      } else {
        return {
          success: false,
          error: saveResult.error
        };
      }
      
    } catch (error) {
      console.error('Certificate generation and save error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate certificate data
   * @param {Object} certificateData - Certificate data to validate
   * @returns {Object} Validation result
   */
  static validateCertificateData(certificateData) {
    const requiredFields = [
      'certificate_id',
      'verification_code',
      'student_name',
      'course_title',
      'instructor_name',
      'organization_name',
      'completion_date',
      'issued_date',
      'final_grade_percentage',
      'total_lessons_completed',
      'total_quizzes_passed'
    ];

    const missingFields = requiredFields.filter(field => !certificateData[field]);

    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Validate data types and ranges
    if (typeof certificateData.final_grade_percentage !== 'number' || 
        certificateData.final_grade_percentage < 0 || 
        certificateData.final_grade_percentage > 100) {
      return {
        valid: false,
        error: 'Final grade percentage must be a number between 0 and 100'
      };
    }

    if (typeof certificateData.total_lessons_completed !== 'number' || 
        certificateData.total_lessons_completed < 0) {
      return {
        valid: false,
        error: 'Total lessons completed must be a non-negative number'
      };
    }

    if (typeof certificateData.total_quizzes_passed !== 'number' || 
        certificateData.total_quizzes_passed < 0) {
      return {
        valid: false,
        error: 'Total quizzes passed must be a non-negative number'
      };
    }

    return { valid: true };
  }
}

module.exports = CertificateGenerator;