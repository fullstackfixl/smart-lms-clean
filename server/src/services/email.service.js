const nodemailer = require('nodemailer');
const axios = require('axios');

class EmailService {
    constructor() {
        this.transporter = this.createTransporter();
    }

    createTransporter() {
        const service = process.env.EMAIL_SERVICE || 'gmail';

        if (service === 'gmail') {
            return nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        } else {
            // Fallback/Generic SMTP
            return nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT) || 465,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        }
    }

    /**
     * Generic Send Email
     */
    async sendEmail(options) {
        // Handle both old-style (to, subject, text, html) and new-style ({to, subject, html})
        let mailOptions;
        if (arguments.length > 1) {
            mailOptions = {
                to: arguments[0],
                subject: arguments[1],
                text: arguments[2],
                html: arguments[3]
            };
        } else {
            mailOptions = options;
        }

        const { to, subject, text, html } = mailOptions;

        try {
            // Priority 1: Brevo (if API key exists)
            if (process.env.BREVO_API_KEY) {
                try {
                    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
                        sender: {
                            name: 'Smart LMS',
                            email: process.env.EMAIL_FROM || 'noreply@smartlms.com'
                        },
                        to: [{ email: to }],
                        subject: subject,
                        htmlContent: html || text
                    }, {
                        headers: {
                            'api-key': process.env.BREVO_API_KEY,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (response.status === 201 || response.status === 200) {
                        console.log(`📧 [Email] Sent via Brevo to ${to}`);
                        return true;
                    }
                } catch (brevoErr) {
                    console.warn('⚠️ [Email] Brevo failed, checking next provider:', brevoErr.response?.data || brevoErr.message);
                }
            }

            // Priority 2: Resend (if API key exists)
            if (process.env.RESEND_API_KEY) {
                try {
                    const response = await axios.post('https://api.resend.com/emails', {
                        from: process.env.EMAIL_FROM || 'Smart LMS <noreply@smartlms.com>',
                        to: [to],
                        subject: subject,
                        html: html || text
                    }, {
                        headers: {
                            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (response.status === 200 || response.status === 201) {
                        console.log(`📧 [Email] Sent via Resend to ${to}`);
                        return true;
                    }
                } catch (resendErr) {
                    console.warn('⚠️ [Email] Resend failed, falling back to Nodemailer:', resendErr.message);
                }
            }

            // Priority 3: Nodemailer (Gmail/SMTP)
            // In production, we only use this as a last resort if API keys fail
            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to,
                subject,
                text,
                html
            });

            console.log(`📧 [Email] Sent via Nodemailer to ${to} | MessageID: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error('❌ [Email] All providers failed:', error.message);
            return false;
        }
    }

    /**
     * Compatibility for NotificationService
     */
    async sendTemplatedEmail(emailData) {
        const { to, templateName, data } = emailData;
        let html = '';
        let subject = 'Smart LMS Notification';

        switch (templateName) {
            case 'invitation':
                html = this.generateInvitationTemplate(data.organizationName, data.setupLink || data.link);
                subject = `Invitation to join ${data.organizationName} - Smart LMS`;
                break;
            case 'password_reset':
                html = this.generatePasswordResetTemplate(data.resetLink || data.link);
                subject = 'Password Reset Request - Smart LMS';
                break;
            case 'otp':
                html = this.generateOtpTemplate(data.otp || data.token);
                subject = 'Your Smart LMS Authentication Code';
                break;
            case 'user_creation':
                html = this.generateUserCreationTemplate(data.name, data.email, data.password, data.loginUrl || data.link);
                subject = 'Welcome to Smart LMS - Account Created';
                break;
            default:
                html = `<p>${data.message || 'No content'}</p>`;
        }

        return this.sendEmail({ to, subject, html });
    }

    generateInvitationTemplate(orgName, link) {
        return `
      <div style="background:#f8fafc;padding:28px 0;">
        <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:640px;margin:0 auto;padding:0 16px;">
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            <div style="padding:22px 24px;border-bottom:1px solid #f1f5f9;background:linear-gradient(180deg,#fff7ed 0%, #ffffff 80%);">
              <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;font-weight:800;">Smart LMS Invitation</div>
              <div style="margin-top:6px;font-size:20px;line-height:1.25;font-weight:900;color:#0f172a;">Join ${orgName}</div>
              <div style="margin-top:6px;font-size:14px;color:#475569;">You’ve been invited to activate your account and join your organization workspace.</div>
            </div>

            <div style="padding:22px 24px;">
              <div style="font-size:14px;color:#334155;line-height:1.6;">
                Click the button below to finish setup. This link is single-use and expires in <strong>7 days</strong>.
              </div>

              <div style="margin:18px 0 8px;">
                <a href="${link}" style="background:#f97316;color:#ffffff;padding:12px 18px;text-decoration:none;border-radius:12px;font-weight:900;display:inline-block;">Accept Invitation</a>
              </div>

              <div style="margin-top:12px;font-size:12px;color:#64748b;line-height:1.5;">
                If the button doesn’t work, copy and paste this link:
                <div style="margin-top:8px;word-break:break-all;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;color:#0f172a;">${link}</div>
              </div>
            </div>

            <div style="padding:16px 24px;border-top:1px solid #f1f5f9;background:#ffffff;">
              <div style="font-size:12px;color:#94a3b8;line-height:1.5;">If you didn’t expect this invitation, you can safely ignore this email.</div>
            </div>
          </div>
        </div>
      </div>
    `;
    }

    generatePasswordResetTemplate(link) {
        return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5;">Password Reset</h2>
        <p>Click below to reset your password:</p>
        <div style="margin: 30px 0;">
          <a href="${link}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">This link expires in 15 minutes.</p>
        <p style="color: #64748b; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        <p style="color: #64748b; font-size: 14px;">Link: ${link}</p>
      </div>
    `;
    }

    generateOtpTemplate(token) {
        return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
        <h2 style="color: #4f46e5;">Authentication Code</h2>
        <p>Use the code below to verify your identity:</p>
        <div style="margin: 30px 0; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; background: #f1f5f9; padding: 20px; border-radius: 8px;">
          ${token}
        </div>
        <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes.</p>
      </div>
    `;
    }

    generateUserCreationTemplate(name, email, password, loginUrl) {
        return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Welcome to Smart LMS!</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your account has been created successfully. You can now log in using the credentials below:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Your Account</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">For security reasons, we recommend changing your password after your first login.</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="text-align: center; color: #9ca3af; font-size: 12px;">&copy; ${new Date().getFullYear()} Smart LMS. All rights reserved.</p>
      </div>
    `;
    }
}

module.exports = new EmailService();
