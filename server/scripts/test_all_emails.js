
require('dotenv').config({ path: './server/.env' });
const emailService = require('../src/services/emailService');
const mfaService = require('../src/services/mfaService');

async function testAllEmails() {
    const testEmail = "dushyantkhandelwal4665@gmail.com";
    console.log(`🚀 Starting Comprehensive Email Test for: ${testEmail}\n`);

    // 1. Test OTP via MFAService
    console.log('1️⃣ Triggering OTP Email via MFAService...');
    try {
        const otpSuccess = await mfaService.sendOTPEmail(testEmail, '123456');
        console.log(otpSuccess ? '✅ OTP Email Sent' : '❌ OTP Email Failed');
    } catch (err) {
        console.error('❌ OTP Error:', err.message);
    }

    // 2. Test Approval Email via EmailService
    console.log('\n2️⃣ Triggering Platform Approval Email...');
    try {
        const approvalSuccess = await emailService.sendApprovalEmail(testEmail, 'http://localhost:3000/setup-link');
        console.log(approvalSuccess ? '✅ Approval Email Sent' : '❌ Approval Email Failed');
    } catch (err) {
        console.error('❌ Approval Error:', err.message);
    }

    // 3. Test Org Invite Email
    console.log('\n3️⃣ Triggering Org Invite Email...');
    try {
        const inviteSuccess = await emailService.sendOrgInviteEmail(
            testEmail,
            'Test Academy',
            'School',
            'http://localhost:3000/invite-link'
        );
        console.log(inviteSuccess ? '✅ Org Invite Email Sent' : '❌ Invite Failed');
    } catch (err) {
        console.error('❌ Invite Error:', err.message);
    }

    // 4. Test Verification Email
    console.log('\n4️⃣ Triggering Verification Email...');
    try {
        const verifySuccess = await emailService.sendVerificationEmail(testEmail, 'Dushyant', 'http://localhost:3000/verify-link');
        console.log(verifySuccess ? '✅ Verification Email Sent' : '❌ Verification Failed');
    } catch (err) {
        console.error('❌ Verification Error:', err.message);
    }

    console.log('\n🏁 All tests completed. Please check your inbox!');
}

testAllEmails().catch(console.error);
