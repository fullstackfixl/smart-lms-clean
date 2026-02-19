/**
 * Utility for Sending Emails using Nodemailer
 */
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ ERROR: EMAIL_USER or EMAIL_PASS not set in .env');
    throw new Error('Email service not configured. Please set EMAIL_USER and EMAIL_PASS in .env file');
  }

  // Remove any quotes and extra spaces from password
  const emailPassword = process.env.EMAIL_PASS.replace(/['"]/g, '').trim();

  console.log('📧 [EMAIL] Attempting to send email...');
  console.log('📧 [EMAIL] Config:', {
    user: process.env.EMAIL_USER,
    to: options.to,
    subject: options.subject,
    passLength: emailPassword.length,
    service: 'gmail'
  });

  // Create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: emailPassword
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000, // 10 seconds timeout
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  // Verify transporter configuration
  try {
    await transporter.verify();
    console.log('✅ [EMAIL] SMTP connection verified successfully');
  } catch (verifyError) {
    console.error('❌ [EMAIL] SMTP verification failed:', verifyError.message);
    console.error('❌ [EMAIL] Full error:', verifyError);
    throw new Error(`Email service verification failed: ${verifyError.message}`);
  }

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
    console.log('📧 [EMAIL] Sending email to:', options.to);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [EMAIL] Email sent successfully!`);
    console.log(`✅ [EMAIL] Message ID: ${info.messageId}`);
    console.log(`✅ [EMAIL] Response: ${info.response}`);
    return info;
  } catch (error) {
    console.error('❌ [EMAIL] Error sending email:', error.message);
    console.error('❌ [EMAIL] Error code:', error.code);
    console.error('❌ [EMAIL] Full error:', error);
    
    // Provide specific error messages
    if (error.code === 'EAUTH') {
      throw new Error('Gmail authentication failed. Please check your EMAIL_USER and EMAIL_PASS (app password) in .env file');
    } else if (error.code === 'ESOCKET') {
      throw new Error('Network error. Please check your internet connection');
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error('Connection timeout. Gmail SMTP server is not responding');
    } else {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
};

module.exports = sendEmail;