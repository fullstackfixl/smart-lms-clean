const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const emailService = require('./src/services/emailService');

async function testEmail() {
    const targetEmail = 'dushyant22062003@gmail.com';
    console.log(`🚀 Sending test email to ${targetEmail}...`);

    const success = await emailService.sendEmail(
        targetEmail,
        'Smart LMS - System Test',
        'This is a test email to verify that the organization onboarding flow can send real emails. If you received this, it works!',
        '<h1>Smart LMS Working!</h1><p>The email system is now fully functional.</p>'
    );

    if (success) {
        console.log('✅ Test email sent successfully! Please check your inbox.');
    } else {
        console.log('❌ Failed to send real email. Check server logs for details.');
    }
}

testEmail();
