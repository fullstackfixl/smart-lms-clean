# Bugfix Requirements Document

## Introduction

The Smart LMS application currently has email functionality that fails to work reliably after deployment on Render. The system has two competing email service implementations (email.service.js and emailService.js) with complex fallback logic that causes confusion and unreliable email delivery. The bug manifests when emails fail to send in production, particularly for critical flows like OTP verification, password reset, organization invitations, and user welcome emails.

This bugfix will consolidate the email implementation into a single, simplified Nodemailer service using Gmail's service mode with App Password authentication, ensuring reliable email delivery on Render with a clean fallback to Resend API if SMTP is blocked.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the application is deployed on Render THEN emails fail to send reliably due to multiple competing email service implementations

1.2 WHEN email.service.js and emailService.js both exist THEN the system has conflicting transporter configurations causing unpredictable behavior

1.3 WHEN SMTP configuration uses manual host/port settings THEN the complexity increases and Gmail service mode benefits are lost

1.4 WHEN transporter.verify() fails during initialization THEN the error is logged but the root cause (missing env vars, incorrect App Password) is not clearly communicated

1.5 WHEN the server starts without proper SMTP credentials THEN the application may crash or fail silently without graceful degradation

1.6 WHEN developers configure email settings THEN they face confusion about which environment variables to use (EMAIL_USER vs SMTP_EMAIL, EMAIL_PASS vs SMTP_PASS)

1.7 WHEN Render blocks SMTP ports THEN there is no clear fallback mechanism to API-based email delivery

### Expected Behavior (Correct)

2.1 WHEN the application is deployed on Render THEN emails SHALL send reliably using a single consolidated email service implementation

2.2 WHEN the email service initializes THEN it SHALL use only one service file (/services/mailer.js) with Gmail service mode configuration

2.3 WHEN configuring Gmail SMTP THEN the system SHALL use service: "gmail" mode with SMTP_EMAIL and SMTP_PASS environment variables

2.4 WHEN transporter.verify() is called on server start THEN it SHALL log clear error messages indicating missing credentials or incorrect App Password format

2.5 WHEN SMTP credentials are missing or invalid THEN the server SHALL start gracefully without crashing and log helpful setup instructions

2.6 WHEN developers configure email settings THEN they SHALL use standardized environment variables: SMTP_EMAIL and SMTP_PASS (16-character Gmail App Password)

2.7 WHEN Render blocks SMTP ports THEN the system SHALL automatically fall back to Resend API for email delivery

2.8 WHEN sending OTP, invitation, password reset, or welcome emails THEN the system SHALL use reusable template functions from the mailer service

2.9 WHEN Gmail 2FA is not enabled THEN the verification error SHALL clearly instruct developers to enable 2FA and generate an App Password

### Unchanged Behavior (Regression Prevention)

3.1 WHEN emails are sent successfully via SMTP THEN the system SHALL CONTINUE TO log success messages with recipient and message ID

3.2 WHEN email templates are generated THEN they SHALL CONTINUE TO use HTML formatting with proper styling and branding

3.3 WHEN the Resend API fallback is triggered THEN it SHALL CONTINUE TO use the RESEND_API_KEY environment variable

3.4 WHEN email sending fails completely THEN the system SHALL CONTINUE TO log the failure without crashing the application

3.5 WHEN the server starts THEN it SHALL CONTINUE TO initialize all other services (database, socket.io) regardless of email service status

3.6 WHEN environment variables are loaded THEN the system SHALL CONTINUE TO use dotenv for configuration management
