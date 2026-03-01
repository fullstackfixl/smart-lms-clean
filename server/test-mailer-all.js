require('dotenv').config();
const mailer = require('./src/services/mailer');

const TEST_RECIPIENT = "dushyantkhandelwal4665@gmail.com";

async function runTests() {
    console.log("🚀 Starting Comprehensive Email Tests...");
    console.log(`📧 Target Recipient: ${TEST_RECIPIENT}`);
    console.log("-----------------------------------------");

    try {
        // 1. Password OTP Test
        console.log("📝 Scenario 1: Password OTP...");
        const otpCode = "123456";
        const otpHtml = mailer.generateOtpTemplate(otpCode);
        await mailer.sendEmail(TEST_RECIPIENT, "Test: Email Verification - Smart LMS", otpHtml);
        console.log("✅ OTP Email sent.");

        // 2. Organization Invitation Test
        console.log("📝 Scenario 2: Organization Invitation...");
        const inviteLink = "https://smartlms.com/setup?token=test_token_123";
        const inviteHtml = mailer.generateInvitationTemplate("Test Academy", inviteLink);
        await mailer.sendEmail(TEST_RECIPIENT, "Test: Organization Invitation - Smart LMS", inviteHtml);
        console.log("✅ Invitation Email sent.");

        // 3. Password Reset Test
        console.log("📝 Scenario 3: Password Reset...");
        const resetLink = "https://smartlms.com/reset?token=test_reset_token";
        const resetHtml = mailer.generatePasswordResetTemplate(resetLink);
        await mailer.sendEmail(TEST_RECIPIENT, "Test: Reset Your Password - Smart LMS", resetHtml);
        console.log("✅ Password Reset Email sent.");

        // 4. Welcome Email Test (User Creation)
        console.log("📝 Scenario 4: Welcome Email...");
        const welcomeHtml = mailer.generateUserCreationTemplate("Dushyant", "Instructor", "Smart University");
        await mailer.sendEmail(TEST_RECIPIENT, "Test: Welcome to Smart LMS", welcomeHtml);
        console.log("✅ Welcome Email sent.");

        // 5. Course Enrollment Test
        console.log("📝 Scenario 5: Course Enrollment...");
        const enrollmentHtml = mailer.generateEnrollmentTemplate("Dushyant", "Fullstack Web Development", "Smart Academy");
        await mailer.sendEmail(TEST_RECIPIENT, "Test: Enrollment Successful - Smart LMS", enrollmentHtml);
        console.log("✅ Enrollment Email sent.");

        console.log("-----------------------------------------");
        console.log("🎉 All test emails have been dispatched successfully!");
        console.log("Please check your inbox at dushyantkhandelwal4665@gmail.com");
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        process.exit(1);
    }
}

runTests();
