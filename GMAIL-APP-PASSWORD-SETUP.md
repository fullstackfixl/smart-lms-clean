# Gmail App Password Setup Guide

## Current Issue
Gmail is rejecting the authentication with error:
```
535-5.7.8 Username and Password not accepted
```

This means the app password in `.env` is either:
- Incorrect
- Expired
- Not properly generated
- 2FA is not enabled on the Gmail account

## Steps to Fix

### 1. Enable 2-Factor Authentication (Required)
1. Go to https://myaccount.google.com/security
2. Click on "2-Step Verification"
3. Follow the steps to enable 2FA
4. **You MUST have 2FA enabled to create app passwords**

### 2. Generate New App Password
1. Go to https://myaccount.google.com/apppasswords
   - OR: Google Account → Security → 2-Step Verification → App passwords
2. Sign in if prompted
3. Click "Select app" → Choose "Mail"
4. Click "Select device" → Choose "Other (Custom name)"
5. Enter name: "Smart LMS Server"
6. Click "Generate"
7. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

### 3. Update .env File
1. Open `server/.env`
2. Find the line: `EMAIL_PASS=hdgguhrhbbjezzny`
3. Replace with your new app password (remove spaces):
   ```
   EMAIL_PASS=abcdefghijklmnop
   ```
4. Save the file

### 4. Update Production Environment (Render)
1. Go to your Render dashboard: https://dashboard.render.com
2. Select your backend service: `smart-lms-clean-1`
3. Go to "Environment" tab
4. Find `EMAIL_PASS` variable
5. Click "Edit" and update with the new app password
6. Click "Save Changes"
7. Render will automatically redeploy

### 5. Restart Local Server
```bash
cd server
npm run dev
```

### 6. Test Email Sending
```bash
cd server
node test-registration-local.js
```

You should see:
```
✅ [EMAIL] Email sent successfully!
✅ SUCCESS: OTP request successful
```

## Alternative: Use Mailtrap for Testing

If you want to test without fixing Gmail, you can use Mailtrap (already configured in .env):

1. Uncomment Mailtrap config in `server/.env`:
```env
EMAIL_SERVICE=smtp
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=5eac1b42c45175
EMAIL_PASS=68249020a71626
EMAIL_FROM=noreply@smartlms.com
```

2. Comment out Gmail config:
```env
# EMAIL_SERVICE=gmail
# EMAIL_USER=dushyant4665fixlsolution@gmail.com
# EMAIL_PASS=hdgguhrhbbjezzny
```

3. Restart server

**Note:** Mailtrap emails won't reach real inboxes - they're captured in Mailtrap's inbox for testing.

## Current Workaround

Until you fix the Gmail app password, the system will:
- Return OTP in the API response
- Display OTP on the registration page
- Allow users to complete registration without email

This is a temporary solution. **You should fix the Gmail app password for production use.**

## Verification Checklist

- [ ] 2FA enabled on Gmail account
- [ ] New app password generated
- [ ] `.env` file updated with new password
- [ ] Render environment variable updated
- [ ] Local server restarted
- [ ] Email sending tested successfully
- [ ] Production deployment verified

## Support Links

- Gmail App Passwords: https://myaccount.google.com/apppasswords
- Gmail 2FA Setup: https://myaccount.google.com/security
- Render Dashboard: https://dashboard.render.com
- Mailtrap (Testing): https://mailtrap.io

## Contact

If you continue having issues:
1. Check Gmail account security settings
2. Verify 2FA is enabled
3. Try generating a new app password
4. Check if Gmail is blocking the login attempt
5. Review Gmail security alerts: https://myaccount.google.com/notifications
