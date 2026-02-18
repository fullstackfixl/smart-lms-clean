/**
 * Test Email Sending
 * Run this script to test if email configuration is working
 * Usage: node test-email.js <recipient-email>
 */

require('dotenv').config();
const sendEmail = require('./src/utils/email');

const testEmail = async () => {
  const recipientEmail = process.argv[2] || process.env.EMAIL_USER;
  
  console.log('🧪 Testing Email Configuration...');
  console.log('📧 Recipient:', recipientEmail);
  console.log('📧 Sender:', process.env.EMAIL_USER);
  console.log('📧 Service: Gmail');
  console.log('');
  
  try {
    const result = await sendEmail({
      to: recipientEmail,
      subject: 'Test Email from Smart LMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Email Test Successful!</h2>
          <p>This is a test email from Smart LMS.</p>
          <p>If you received this email, your email configuration is working correctly.</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="font-size: 24px; font-weight: bold; color: #10b981;">✅ Email Service is Working!</p>
          </div>
          <p>Test Details:</p>
          <ul>
            <li>Sender: ${process.env.EMAIL_USER}</li>
            <li>Service: Gmail SMTP</li>
            <li>Time: ${new Date().toISOString()}</li>
          </ul>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">Smart LMS - Learning Management System</p>
        </div>
      `
    });
    
    console.log('');
    console.log('✅ SUCCESS! Email sent successfully!');
    console.log('✅ Message ID:', result.messageId);
    console.log('✅ Response:', result.response);
    console.log('');
    console.log('📬 Please check your inbox at:', recipientEmail);
    console.log('📬 Also check your spam/junk folder if you don\'t see it');
    
  } catch (error) {
    console.log('');
    console.error('❌ FAILED! Email sending failed!');
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting Steps:');
    console.log('1. Verify EMAIL_USER is correct in .env file');
    console.log('2. Verify EMAIL_PASS is a valid Gmail App Password (not your regular password)');
    console.log('3. Generate a new App Password at: https://myaccount.google.com/apppasswords');
    console.log('4. Make sure 2-Step Verification is enabled on your Google account');
    console.log('5. Check your internet connection');
    console.log('');
    console.log('📖 How to create Gmail App Password:');
    console.log('   1. Go to https://myaccount.google.com/security');
    console.log('   2. Enable 2-Step Verification if not already enabled');
    console.log('   3. Go to https://myaccount.google.com/apppasswords');
    console.log('   4. Select "Mail" and "Other (Custom name)"');
    console.log('   5. Enter "Smart LMS" as the name');
    console.log('   6. Copy the 16-character password (no spaces)');
    console.log('   7. Update EMAIL_PASS in server/.env file');
    console.log('');
    
    process.exit(1);
  }
};

testEmail();
