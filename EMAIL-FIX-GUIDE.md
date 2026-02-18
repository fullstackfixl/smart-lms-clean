# Email Sending Fix Guide

## Problem
Users are not receiving OTP verification emails during registration.

## Changes Made

### 1. Enhanced Email Utility (`server/src/utils/email.js`)
- Added SMTP connection verification before sending
- Added detailed error logging with specific error codes
- Added better error messages for common issues (EAUTH, ESOCKET, ETIMEDOUT)
- Added explicit SMTP configuration (host, port, TLS settings)

### 2. Fixed Auth Routes (`server/src/routes/auth.js`)
- Changed email error handling from "silent fail" to "throw error"
- Now returns proper error to user if email fails to send
- Deletes OTP record if email fails (prevents confusion)
- Both `/auth/register/request-otp` and `/auth/register/resend-otp` now properly handle email errors

### 3. Created Email Test Script (`server/test-email.js`)
- Test your email configuration before deploying
- Provides detailed troubleshooting steps
- Shows exact error messages

## How to Test Email Configuration

### Step 1: Test Email Sending Locally

```bash
cd server
node test-email.js your-email@example.com
```

This will:
- Verify SMTP connection
- Send a test email
- Show detailed error messages if it fails

### Step 2: Check Gmail App Password

The current password in `.env` is: `hdgguhrhbbjezzny`

**IMPORTANT**: This must be a Gmail App Password, NOT your regular Gmail password.

#### How to Create/Verify Gmail App Password:

1. Go to https://myaccount.google.com/security
2. Make sure **2-Step Verification** is ENABLED
3. Go to https://myaccount.google.com/apppasswords
4. Create a new App Password:
   - Select "Mail"
   - Select "Other (Custom name)"
   - Enter "Smart LMS"
   - Click "Generate"
5. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)
6. Remove all spaces: `abcdefghijklmnop`
7. Update `EMAIL_PASS` in `server/.env` file

### Step 3: Common Issues and Solutions

#### Issue 1: "Gmail authentication failed" (EAUTH)
**Solution**: 
- Your app password is incorrect or expired
- Generate a new app password (see steps above)
- Make sure 2-Step Verification is enabled

#### Issue 2: "Network error" (ESOCKET)
**Solution**:
- Check your internet connection
- Check if port 587 is blocked by firewall
- Try using port 465 with `secure: true` in email.js

#### Issue 3: "Connection timeout" (ETIMEDOUT)
**Solution**:
- Gmail SMTP might be blocked by your ISP
- Try using a VPN
- Try using a different network

#### Issue 4: Email goes to spam folder
**Solution**:
- This is normal for new senders
- Ask users to check spam/junk folder
- Mark the email as "Not Spam"
- Over time, Gmail will learn and deliver to inbox

### Step 4: Alternative Email Services

If Gmail continues to fail, you can use these alternatives:

#### Option A: SendGrid (Recommended for Production)
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
```

#### Option B: Mailtrap (For Testing Only)
```env
EMAIL_SERVICE=smtp
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_user
EMAIL_PASS=your_mailtrap_pass
```

## Testing the Full Registration Flow

### 1. Start the Backend Server
```bash
cd server
npm start
```

### 2. Start the Frontend Server
```bash
cd client
npm run dev
```

### 3. Test Registration
1. Go to http://localhost:3000/register
2. Fill in the registration form
3. Click "Register"
4. Check the backend console for email logs:
   - Look for `✅ [EMAIL] Email sent successfully!`
   - Or `❌ [EMAIL] Error sending email:`
5. Check your email inbox (and spam folder)
6. Enter the OTP code

## Deployment Checklist

### Before Deploying to Render:

1. ✅ Test email locally using `test-email.js`
2. ✅ Verify Gmail App Password is correct
3. ✅ Update `server/.env` on Render with correct EMAIL_PASS
4. ✅ Test registration flow locally
5. ✅ Deploy to Render
6. ✅ Check Render logs for email errors
7. ✅ Test registration on production

### Render Environment Variables:

Make sure these are set in Render dashboard:

```
EMAIL_SERVICE=gmail
EMAIL_USER=dushyant4665fixlsolution@gmail.com
EMAIL_PASS=hdgguhrhbbjezzny
EMAIL_FROM=dushyant4665fixlsolution@gmail.com
SUPPORT_EMAIL=dushyant4665fixlsolution@gmail.com
```

## Monitoring Email Sending

### Check Backend Logs

Look for these log messages:

**Success:**
```
✅ [EMAIL] SMTP connection verified successfully
✅ [EMAIL] Email sent successfully!
✅ [EMAIL] Message ID: <message-id>
✅ [AUTH] OTP email sent successfully to user@example.com
```

**Failure:**
```
❌ [EMAIL] SMTP verification failed: ...
❌ [EMAIL] Error sending email: ...
❌ [AUTH] Failed to send OTP email to user@example.com
```

## Quick Fix Commands

### Restart Backend Server
```bash
cd server
npm start
```

### Test Email Configuration
```bash
cd server
node test-email.js your-email@example.com
```

### Check Email Logs in Render
1. Go to Render dashboard
2. Select your backend service
3. Click "Logs"
4. Search for "[EMAIL]" or "[AUTH]"

## Support

If email still doesn't work after trying all steps:

1. Check Gmail account security settings
2. Try generating a new App Password
3. Try using a different Gmail account
4. Consider using SendGrid for production
5. Check Render logs for specific error messages

## Summary of Changes

1. ✅ Email utility now verifies SMTP connection before sending
2. ✅ Auth routes now return errors if email fails (no more silent failures)
3. ✅ Added detailed error logging for debugging
4. ✅ Created test script for easy email testing
5. ✅ Added comprehensive troubleshooting guide

The email system will now:
- Verify the connection works before sending
- Show clear error messages if sending fails
- Return errors to the user instead of saying "success" when it failed
- Provide detailed logs for debugging
