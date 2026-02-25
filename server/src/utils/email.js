/**
 * Email Utility - Wrapper around emailService for backward compatibility
 * This maintains the old API while using the new production-ready email service
 */
const emailService = require('../services/emailService');

/**
 * Send email using the new email service
 * Maintains backward compatibility with old sendEmail API
 */
const sendEmail = async (to, subject, html, text) => {
  try {
    // If first argument is an object, assume it's the new options format
    if (to && typeof to === 'object' && !Array.isArray(to)) {
      const options = to;
      return await emailService.sendEmail(
        options.to,
        options.subject,
        options.text || '',
        options.html || options.text
      );
    }

    // Fallback to positional arguments
    return await emailService.sendEmail(to, subject, text || '', html || text);
  } catch (error) {
    console.error('❌ [Email Utility Error]:', error.message);
    throw error;
  }
};

/**
 * Send enrollment email
 */
const sendEnrollmentEmail = async (to, courseName, studentName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Enrollment Confirmation</h2>
      <p>Hello ${studentName},</p>
      <p>You have been successfully enrolled in <strong>${courseName}</strong>.</p>
      <p>You can now access the course materials and start learning.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px;">Smart LMS - Learning Management System</p>
    </div>
  `;

  return await emailService.sendEmail({
    to,
    subject: `Enrollment Confirmation - ${courseName}`,
    html
  });
};

module.exports = sendEmail;
module.exports.sendEnrollmentEmail = sendEnrollmentEmail;
