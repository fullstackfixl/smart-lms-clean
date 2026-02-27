# Email Fix - For Users Without a Domain

If you don't have a domain, **Brevo (formerly Sendinblue)** is the best choice for sending emails from your Render-hosted backend.

## 🚀 How to Set Up Brevo (No Domain Required)

### Step 1: Create a Brevo Account
1.  Go to [Brevo.com](https://www.brevo.com/) and sign up for a free account.

### Step 2: Verify Your Email (Single Sender)
1.  In your Brevo Dashboard, click your name (top-right) > **Senders & IP**.
2.  Click the **Senders** tab > **Add a sender**.
3.  Enter your name and **your personal email address** (the one you want to send emails FROM).
4.  **Important**: Brevo will send a 6-digit code to that email. Copy the code and paste it into Brevo to verify it.
5.  *Success!* You can now send emails from this specific address without owning a domain.

### Step 3: Get Your SMTP API Key
1.  Click your name (top-right) > **SMTP & API**.
2.  Click the **API Keys** tab > **Generate a new API key**.
3.  Copy this key immediately.

## 🛠️ Configuration for Render

Add these to your **Render Environment Variables**:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `BREVO_API_KEY` | `xkeysib-...` | Your newly generated Brevo API key |
| `EMAIL_FROM` | `your-email@gmail.com` | The email you just verified in Brevo |
| `CLIENT_URL` | `https://smart-lms-clean.vercel.app` | Your Vercel URL |

## 🧪 Testing the Setup
I've updated the test script. Once you've added the variables to your local `.env`, run:
```bash
node server/scripts/test_email_api.js
```
If you see **"Brevo success!"**, it will work perfectly on Render!
