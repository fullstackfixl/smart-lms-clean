const nodemailer = require("nodemailer");

/**
 * Centralized Email Service for Smart LMS
 * Implements Nodemailer with Gmail SMTP and Resend fallback.
 */

// Initialize Nodemailer Transporter
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS
    }
});

// Verify Transporter Connection
(async () => {
    try {
        await transporter.verify();
        console.log("✅ [EMAIL SERVICE] SMTP Transport verified and ready");
    } catch (error) {
        console.error("❌ [EMAIL SERVICE] SMTP Transport verification failed:", error.message);
        console.log("💡 [EMAIL SERVICE] Fallback to API-based providers (Resend) will be used if needed.");
    }
})();

/**
 * Main function to send email via Nodemailer or Resend fallback
 */
async function sendEmail({ to, subject, html, text }) {
    try {
        // 1. Primary: SMTP via Nodemailer
        await transporter.sendMail({
            from: `"Smart LMS" <${process.env.SMTP_EMAIL}>`,
            to,
            subject,
            html,
            text: text || "Please view this email in an HTML-capable client."
        });
        console.log(`✅ [EMAIL SERVICE] Email sent via SMTP to: ${to}`);
        return true;
    } catch (error) {
        console.warn(`⚠️ [EMAIL SERVICE] SMTP failed for ${to}, attempting Resend fallback...`);
        console.error("Nodemailer Error:", error.message);

        // 2. Fallback: Resend API
        if (process.env.RESEND_API_KEY) {
            try {
                const response = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
                    },
                    body: JSON.stringify({
                        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
                        to: [to],
                        subject,
                        html
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    console.log(`✅ [EMAIL SERVICE] Email sent via Resend API to: ${to}`);
                    return true;
                } else {
                    console.error("❌ [EMAIL SERVICE] Resend API Error:", data.message || data);
                }
            } catch (resendError) {
                console.error("❌ [EMAIL SERVICE] Resend Fetch Error:", resendError.message);
            }
        }

        // 3. Last Resort: Logging
        console.error(`❌ [EMAIL SERVICE] All delivery methods failed for ${to}`);
        return false;
    }
}

/**
 * --- EMAIL TEMPLATES ---
 */

function generateOtpTemplate(otp) {
    return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2563eb;">Email Verification</h2>
      <p>Your verification code for Smart LMS is:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; color: #1e40af;">
        ${otp}
      </div>
      <p>This OTP expires in 10 minutes.</p>
      <p style="font-size: 14px; color: #666;">If you didn't request this, please ignore this email.</p>
    </div>
  `;
}

function generateInvitationTemplate(orgName, link) {
    return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2563eb;">Organization Invitation</h2>
      <p>Hello,</p>
      <p>You have been invited to join <strong>${orgName}</strong> as an Administrator on Smart LMS.</p>
      <p>Please click the button below to complete your setup:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Complete Setup</a>
      </div>
      <p style="font-size: 14px; color: #666;">This link will expire in 24 hours.</p>
    </div>
  `;
}

function generatePasswordResetTemplate(link) {
    return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2563eb;">Reset Your Password</h2>
      <p>We received a request to reset your password for Smart LMS.</p>
      <p>Click the button below to choose a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="font-size: 14px; color: #666;">This link will expire in 1 hour.</p>
      <p style="font-size: 14px; color: #666;">If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
  `;
}

function generateUserCreationTemplate(name, role, orgName) {
    return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2563eb;">Welcome to Smart LMS</h2>
      <p>Hello ${name},</p>
      <p>An account has been created for you as a <strong>${role}</strong> at <strong>${orgName}</strong>.</p>
      <p>You can now log in using your email address and the credentials provided by your administrator.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL || '#'}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
      </div>
    </div>
  `;
}

module.exports = {
    sendEmail,
    generateOtpTemplate,
    generateInvitationTemplate,
    generatePasswordResetTemplate,
    generateUserCreationTemplate
};
