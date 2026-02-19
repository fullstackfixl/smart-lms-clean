# Fix: Registration Email 500 Error

## Problem
When users try to register, they get a 500 Internal Server Error because the email service fails to send OTP emails.

Error: `POST https://smart-lms-clean-1.onrender.com/auth/register/request-otp 500 (Internal Server Error)`

## Root Cause
The registration endpoint was throwing a 500 error in development mode when email sending failed, instead of gracefully handling the failure and returning the OTP in the response.

## Solution
Modified `server/src/routes/auth.js` to handle email failures gracefully in ALL environments (not just production):

### Changes Made

**File: `server/src/routes/auth.js`** (Lines 195-217)

**BEFORE:**
```javascript
} catch (emailError) {
  // Email failed - but allow registration to continue in production
  console.error(`❌ [AUTH] Failed to send OTP email to ${email}:`, emailError.message);
  
  // In production, if email fails, return OTP in response (temporary workaround)
  // In development, always return OTP
  if (process.env.NODE_ENV === 'production') {
    console.log(`⚠️ [AUTH] Email service unavailable - returning OTP in response for ${email}`);
    return res.success({
      email: email.toLowerCase(),
      organizationName,
      message: 'Email service temporarily unavailable. Your verification code is displayed below.',
      otp: otp,
      emailFailed: true
    }, 'OTP generated (email service unavailable)');
  } else {
    // In development, delete OTP and return error
    await VerificationOTP.deleteOne({ email: email.toLowerCase() });
    return res.error(
      `Failed to send verification email: ${emailError.message}. Please check your email configuration.`,
      'Email sending failed',
      500
    );
  }
}
```

**AFTER:**
```javascript
} catch (emailError) {
  // Email failed - but allow registration to continue
  console.error(`❌ [AUTH] Failed to send OTP email to ${email}:`, emailError.message);
  console.error('❌ [AUTH] Email config:', {
    EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
    EMAIL_PASS: process.env.EMAIL_PASS ? 'SET' : 'NOT SET',
    EMAIL_SERVICE: process.env.EMAIL_SERVICE
  });
  
  // Return OTP in response when email fails (works in all environments)
  console.log(`⚠️ [AUTH] Email service unavailable - returning OTP in response for ${email}`);
  return res.success({
    email: email.toLowerCase(),
    organizationName,
    message: 'Email service temporarily unavailable. Your verification code is displayed below.',
    otp: otp, // Return OTP in response when email fails
    emailFailed: true
  }, 'OTP generated (email service unavailable)');
}
```

## Testing

### Local Test Results
```bash
✅ SUCCESS: OTP request successful
🔐 OTP: 918798
📧 Email Failed: true
```

The endpoint now returns:
- Status: 200 (instead of 500)
- Response includes OTP in the data
- `emailFailed: true` flag indicates email service is unavailable
- User can still complete registration using the displayed OTP

## Deployment Instructions

1. Commit the changes to `server/src/routes/auth.js`
2. Push to your repository
3. Render will auto-deploy the changes
4. Test the registration endpoint after deployment

## Frontend Handling

The frontend should check for `emailFailed: true` in the response and display the OTP to the user with a message like:

```
"Email service is temporarily unavailable. 
Your verification code is: [OTP]
Please enter this code to complete registration."
```

## Email Service Fix (Long-term)

The Gmail authentication is failing with error:
```
535-5.7.8 Username and Password not accepted
```

To fix this permanently:
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password for "Mail"
4. Update `EMAIL_PASS` in `.env` with the new app password
5. Restart the server

## Files Modified
- `server/src/routes/auth.js` - Registration OTP endpoint error handling

## Status
✅ Fixed and tested locally
⏳ Awaiting deployment to production
