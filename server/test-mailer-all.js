require('dotenv').config();
const { sendEmail } = require('./src/services/mailer');
const emailTemplates = require('./src/services/email.service');

const TEST_RECIPIENT = "dushyantkhandelwal4665@gmail.com";

async function runTests() {
    console.log("🚀 Starting Comprehensive Email Tests...");
    console.log(`📧 Target Recipient: ${TEST_RECIPIENT}`);
    console.log("-----------------------------------------");

    try {
        // 1. Password OTP Test
        console.log("📝 Scenario 1: Password OTP...");
        const otpCode = "123456";
        const otpHtml = emailTemplates.generateOtpTemplate(otpCode);
        await sendEmail(TEST_RECIPIENT, "Test: Password OTP - Smart LMS", otpHtml);
        console.log("✅ OTP Email sent.");

        // 2. Organization Approval Test
        console.log("📝 Scenario 2: Organization Approval...");
        const setupLink = "https://smartlms.com/setup?token=test_token_123";
        const approvalHtml = emailTemplates.generateInvitationTemplate("Test Organization", setupLink);
        await sendEmail(TEST_RECIPIENT, "Test: Organization Approved - Smart LMS", approvalHtml);
        console.log("✅ Approval Email sent.");

        // 3. User Invitation Test (Student/Instructor)
        console.log("📝 Scenario 3: User Invitation...");
        const inviteLink = "https://smartlms.com/invite?token=test_invite_token";
        const inviteHtml = emailTemplates.generateInvitationTemplate("Smart Academy", inviteLink);
        await sendEmail(TEST_RECIPIENT, "Test: You are invited to join Smart Academy", inviteHtml);
        console.log("✅ Invitation Email sent.");

        // 4. Welcome Email Test (User Creation)
        console.log("📝 Scenario 4: Welcome Email...");
        const welcomeHtml = emailTemplates.generateUserCreationTemplate("Dushyant", "Instructor", "Smart University");
        await sendEmail(TEST_RECIPIENT, "Test: Welcome to Smart LMS", welcomeHtml);
        console.log("✅ Welcome Email sent.");

        console.log("-----------------------------------------");
        console.log("🎉 All test emails have been dispatched successfully!");
        console.log("Please check your inbox at dushyantkhandelwal4665@gmail.com");
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        process.exit(1);
    }
}

runTests();
