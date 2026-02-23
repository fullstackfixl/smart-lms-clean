const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendEmail(to, subject, text, html) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        text,
        html: html || text
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ [EMAIL SERVICE] Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ [EMAIL SERVICE] Error sending email:', error);
      // Fallback to logging in development
      console.log('-----------------------------------------');
      console.log(`📧 [MOCK EMAIL] To: ${to}`);
      console.log(`📧 [MOCK EMAIL] Subject: ${subject}`);
      console.log(`📧 [MOCK EMAIL] Body: ${text}`);
      console.log('-----------------------------------------');
      return false;
    }
  }

  async sendApprovalEmail(email, setupLink) {
    const subject = 'Your Organization Application has been Approved!';
    const text = `Congratulations! Your application for Smart LMS has been approved.\n\nPlease complete your registration by setting your password here: ${setupLink}\n\nThis link will expire in 24 hours.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 8px;">
        <h2 style="color: #2563eb;">Application Approved!</h2>
        <p>Congratulations! Your application for <strong>Smart LMS</strong> has been approved.</p>
        <p>Please click the button below to set your password and finalize your organization account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${setupLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete Registration</a>
        </div>
        <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #2563eb; word-break: break-all;">${setupLink}</p>
        <p style="font-size: 14px; color: #666; margin-top: 30px;">This link will expire in 24 hours.</p>
      </div>
    `;
    return this.sendEmail(email, subject, text, html);
  }
}

module.exports = new EmailService();
