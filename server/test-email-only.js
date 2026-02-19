const emailService = require('./src/services/emailService');
require('dotenv').config();

async function testEmailSending() {
  console.log('🧪 Testing Production-Ready Email Service');
  console.log('==========================================\n');

  console.log('📧 Email Configuration:');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   User: ${process.env.EMAIL_USER}`);
  console.log(`   Password: ${process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET'}`);
  console.log(`   From: ${process.env.EMAIL_FROM}\n`);

  try {
    console.log('🔄 Initializing email service...\n');
    const initialized = await emailService.initialize();
    
    if (!initialized) {
      console.error('❌ Email service initialization failed');
      console.error('Status:', emailService.getStatus());
      return;
    }

    console.log('✅ Email service initialized successfully\n');
    console.log('📤 Sending test OTP email...\n');
    
    const result = await emailService.sendOTP(
      'dushyantkhandelwal4665@gmail.com',
      '123456',
      'Dushyant Khandelwal',
      'Test Organization'
    );

    if (result.success) {
      console.log('✅ SUCCESS! Email sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}\n`);
      console.log('🎉 Check your inbox at: dushyantkhandelwal4665@gmail.com');
    } else {
      console.error('❌ FAILED! Email sending failed');
      console.error(`Error: ${result.error}`);
      console.error(`Code: ${result.code}\n`);
    }

    // Show service status
    console.log('\n📊 Service Status:', emailService.getStatus());

  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await emailService.close();
  }
}

testEmailSending();
