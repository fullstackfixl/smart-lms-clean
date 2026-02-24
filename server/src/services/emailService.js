const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpSecure = (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailService = process.env.EMAIL_SERVICE || 'gmail';

    if (smtpHost && emailUser && emailPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });
    } else {
      this.transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });
    }
  }

  async ensureTransport() {
    if (!this.transporter) return false;
    try {
      await this.transporter.verify();
      return true;
    } catch {
      const fallbackService = process.env.EMAIL_SERVICE || 'gmail';
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;
      try {
        this.transporter = nodemailer.createTransport({
          service: fallbackService,
          auth: { user: emailUser, pass: emailPass }
        });
        await this.transporter.verify();
        return true;
      } catch {
        return false;
      }
    }
  }

  async sendViaResend(to, subject, text, html) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@example.com';
    if (!apiKey) return false;
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          html: html || text
        })
      });
      if (!res.ok) {
        const body = await res.text();
        console.error('❌ [EMAIL SERVICE] Resend error:', res.status, body);
        return false;
      }
      console.log('✅ [EMAIL SERVICE] Resend email sent');
      return true;
    } catch (err) {
      console.error('❌ [EMAIL SERVICE] Resend send failed:', err);
      return false;
    }
  }

  async sendEmail(to, subject, text, html) {
    try {
      const ready = await this.ensureTransport();
      if (!ready) {
        console.error('❌ [EMAIL SERVICE] Transport not ready, trying Resend fallback');
        const resendOk = await this.sendViaResend(to, subject, text, html);
        return resendOk;
      }
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
      // Attempt Resend fallback if SMTP failed mid-send
      const resendOk = await this.sendViaResend(to, subject, text, html);
      if (resendOk) return true;
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
