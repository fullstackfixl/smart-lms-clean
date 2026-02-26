const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransport();
  }

  async initTransport() {
    try {
      // Prefer explicit SMTP host/port if provided
      if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || '587', 10),
          secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        console.log('📧 [EMAIL SERVICE] Using SMTP transport:', process.env.EMAIL_HOST);
      } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        // Fallback: service-based (e.g., gmail). For gmail, prefer explicit SMTP for reliability.
        if ((process.env.EMAIL_SERVICE || '').toLowerCase() === 'gmail') {
          const port = parseInt(process.env.EMAIL_PORT || '465', 10);
          const secure = port === 465 || process.env.EMAIL_SECURE === 'true';
          this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port,
            secure,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          });
          console.log('📧 [EMAIL SERVICE] Using Gmail SMTP transport (smtp.gmail.com):', `port=${port} secure=${secure}`);
        } else {
          this.transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          });
          console.log('📧 [EMAIL SERVICE] Using service transport:', process.env.EMAIL_SERVICE || 'gmail');
        }
      } else {
        // Development fallback: Ethereal test account
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        this.ethereal = true;
        console.log('📧 [EMAIL SERVICE] Using Ethereal test transport:', testAccount.user);
      }

      // Verify transport
      if (this.transporter) {
        await this.transporter.verify();
        console.log('✅ [EMAIL SERVICE] Transport verified and ready');
      }
    } catch (err) {
      console.error('❌ [EMAIL SERVICE] Transport initialization failed:', err);
    }
  }

  async sendEmail(to, subject, text, html) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@smartlms.local',
        to,
        subject,
        text,
        html: html || text
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ [EMAIL SERVICE] Email sent:', info.messageId);
      if (this.ethereal) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('🔗 [EMAIL SERVICE] Ethereal preview URL:', previewUrl);
        }
      }
      return true;
    } catch (error) {
      console.error('❌ [EMAIL SERVICE] Error sending email:', error);
      // Automatic fallback: Try Ethereal and resend
      try {
        if (!this.ethereal) {
          console.log('📧 [EMAIL SERVICE] Falling back to Ethereal test transport...');
          const testAccount = await nodemailer.createTestAccount();
          this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
          });
          this.ethereal = true;
          const info = await this.transporter.sendMail({
            from: 'Smart LMS <no-reply@smartlms.test>',
            to,
            subject,
            text,
            html: html || text
          });
          console.log('✅ [EMAIL SERVICE] Fallback email sent:', info.messageId);
          const previewUrl = nodemailer.getTestMessageUrl(info);
          if (previewUrl) {
            console.log('🔗 [EMAIL SERVICE] Ethereal preview URL:', previewUrl);
          }
          return true;
        }
      } catch (fallbackError) {
        console.error('❌ [EMAIL SERVICE] Fallback email failed:', fallbackError);
      }
      // Final fallback to logging
      console.log('-----------------------------------------');
      console.log(`📧 [MOCK EMAIL] To: ${to}`);
      console.log(`📧 [MOCK EMAIL] Subject: ${subject}`);
      console.log(`📧 [MOCK EMAIL] Body: ${text}`);
      console.log('-----------------------------------------');
      return false;
    }
  }

  async sendApprovalEmail(email, setupLink) {
    const subject = 'Complete Your Smart LMS Registration';
    console.log(`📧 [EMAIL SERVICE] Sending approval email to: ${email}`);
    const text = `Congratulations! Your application for Smart LMS has been approved.\n\nPlease complete your registration by setting your password here: ${setupLink}\n\nThis link will expire in 24 hours.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 8px;">
        <h2 style="color: #2563eb;">Complete Your Smart LMS Registration</h2>
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

  async sendOrgInviteEmail(email, orgName, orgType, setupLink) {
    const subject = `Invitation to join ${orgName} on Smart LMS`;
    console.log(`📧 [EMAIL SERVICE] Sending org invite email to: ${email}`);

    const text = `Hello,\n\nYou have been invited as the Administrator for ${orgName} (${orgType}) on Smart LMS.\n\nPlease complete your organization setup by clicking the link below:\n\n${setupLink}\n\nThis link will expire in 24 hours.`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Organization Invitation</h2>
        <p>Hello,</p>
        <p>You have been invited as the <strong>Administrator</strong> for <strong>${orgName}</strong> (${orgType}) on Smart LMS.</p>
        <p>Please click the button below to complete your organization setup and set your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${setupLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete Setup</a>
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
