const nodemailer = require("nodemailer");

/**
 * Reusable Nodemailer transporter for Gmail Service Mode
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Reusable sendEmail function
 */
async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"Smart LMS" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html
    });

    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    throw new Error("Email delivery failed");
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
      <p>You have been invited to join <strong>${orgName}</strong> on Smart LMS.</p>
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
      <p>Click the button below to choose a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="font-size: 14px; color: #666;">This link will expire in 1 hour.</p>
    </div>
  `;
}

function generateEnrollmentTemplate(studentName, courseTitle, orgName) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2563eb;">Course Enrollment Successful</h2>
      <p>Hello ${studentName},</p>
      <p>You have successfully enrolled in <strong>${courseTitle}</strong> at <strong>${orgName}</strong>.</p>
      <p>You can now access your course materials from the student dashboard.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL || '#'}/student/courses" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to My Courses</a>
      </div>
    </div>
  `;
}

function generateUserCreationTemplate(name, role, orgName) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2563eb;">Welcome to Smart LMS</h2>
      <p>Hello ${name},</p>
      <p>An account has been created for you as a <strong>${role}</strong> at <strong>${orgName}</strong>.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL || '#'}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
      </div>
    </div>
  `;
}

module.exports = {
  sendEmail,
  transporter,
  generateOtpTemplate,
  generateInvitationTemplate,
  generatePasswordResetTemplate,
  generateUserCreationTemplate,
  generateEnrollmentTemplate
};
