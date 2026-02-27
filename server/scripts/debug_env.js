
require('dotenv').config({ path: './server/.env' });

async function debugEnv() {
    console.log('BREVO_API_KEY exists:', !!process.env.BREVO_API_KEY);
    if (process.env.BREVO_API_KEY) {
        console.log('BREVO_API_KEY starts with:', process.env.BREVO_API_KEY.substring(0, 8));
    }
    console.log('EMAIL_FROM:', `"${process.env.EMAIL_FROM}"`);
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
}

debugEnv();
