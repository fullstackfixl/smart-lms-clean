/**
 * Utility for Sending Emails using Nodemailer
 */
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('ERROR: EMAIL_USER or EMAIL_PASS not set in .env');
    throw new Error('Email service not configured');
  }

  // Remove any quotes and extra spaces from password
  const emailPassword = process.env.EMAIL_PASS.replace(/['"]/g, '').replace(/\s+/g, '');

  console.log('📧 Email Config:', {
    user: process.env.EMAIL_USER,
    passLength: emailPassword.length,
    service: 'gmail'
  });

  // Create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: emailPassword
    }
  });

  // Define email options
  const mailOptions = {
    from: `Smart LMS <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  };

  // Send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw error;
  }
};

module.exports = sendEmail;