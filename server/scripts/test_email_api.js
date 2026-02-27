require('dotenv').config({ path: './server/.env' });
// Use native fetch in Node 18+
async function testEmailAPIs() {
    const brevoApiKey = process.env.BREVO_API_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;
    const emailTo = "dushyantkhandelwal4665@gmail.com"; // Your email for testing
    const emailFrom = process.env.EMAIL_FROM || emailTo;

    console.log('🚀 Testing Email APIs...');

    if (brevoApiKey) {
        const trimmedKey = brevoApiKey.trim();
        console.log('\n🔵 Testing Brevo API (V3)...');
        console.log('Using Key:', trimmedKey.substring(0, 10) + '...');
        console.log('From Email:', emailFrom);

        try {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': trimmedKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: "Smart LMS Test", email: emailFrom.trim() },
                    to: [{ email: emailTo.trim() }],
                    subject: 'Brevo API Deployment Test',
                    htmlContent: '<strong>Success!</strong> Brevo is working without a domain.'
                })
            });
            const data = await response.json();
            console.log('Status Code:', response.status);
            if (response.ok) console.log('✅ Brevo Success!', data.messageId);
            else {
                console.error('❌ Brevo Error:', JSON.stringify(data, null, 2));
                if (response.status === 401 || data.message === 'Key not found') {
                    console.log('💡 TIP: It looks like you copied the "SMTP Key" (xsmtpsib). You MUST use the "API Key" instead (xkeysib).');
                }
            }
        } catch (e) { console.error('❌ Brevo Fetch Error:', e.message); }
    }

    if (resendApiKey) {
        console.log('\n🔵 Testing Resend API...');
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${resendApiKey}`
                },
                body: JSON.stringify({
                    from: 'Smart LMS <onboarding@resend.dev>',
                    to: [emailTo],
                    subject: 'Resend API Deployment Test',
                    html: '<strong>Success!</strong> If you see this, the Resend API is working and can bypass Render SMTP blocks.'
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✅ Resend Success! Message ID:', data.id);
            } else {
                console.error('❌ Resend API Error:', data);
                if (data.message && data.message.includes('from address')) {
                    console.log('💡 Note: You might need to verify your domain in Resend or use their default test address.');
                }
            }
        } catch (error) {
            console.error('❌ Resend Fetch Error:', error.message);
        }
    }
}

testEmailAPIs();
