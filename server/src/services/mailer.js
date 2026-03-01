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
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body in HTML
 */
async function sendEmail(to, subject, html) {
    try {
        // 1. Primary: SMTP via Gmail
        const info = await transporter.sendMail({
            from: `"Smart LMS" <${process.env.SMTP_EMAIL}>`,
            to,
            subject,
            html
        });

        console.log("✅ Email sent:", info.messageId);
        return info;
    } catch (error) {
        console.error("⚠️ Gmail SMTP sending failed:", error.message);

        // 2. Extra Important Render Fix: API-based mail (Resend)
        // This always works even if SMTP is blocked by Render
        if (process.env.RESEND_API_KEY) {
            try {
                console.log("🔄 Attempting delivery via Resend API...");
                const response = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
                        to,
                        subject,
                        html
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    console.log("✅ Email sent via Resend API:", data.id);
                    return data;
                } else {
                    console.error("❌ Resend API Error:", data.message || data);
                }
            } catch (resendError) {
                console.error("❌ Resend Fetch Error:", resendError.message);
            }
        }

        throw new Error("Email delivery failed after all attempts");
    }
}

module.exports = {
    sendEmail,
    transporter
};
