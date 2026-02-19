/**
 * Production-Ready Email Service
 * Handles email sending with proper error handling, timeouts, and fallbacks
 */
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.lastError = null;
  }

  /**
   * Initialize email transporter based on environment
   */
  async initialize() {
    try {
      // Check if email credentials are configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        logger.warn('Email service not configured - EMAIL_USER or EMAIL_PASS missing');
        this.isConfigured = false;
        return false;
      }

      const isProduction = process.env.NODE_ENV === 'production';
      const emailPassword = process.env.EMAIL_PASS.replace(/['"]/g, '').trim();

      // Production: Use Gmail SMTP with proper configuration
      if (isProduction) {
        logger.info('Initializing Gmail SMTP for production');
        this.transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false, // Use STARTTLS
          auth: {
            user: process.env.EMAIL_USER,
            pass: emailPassword
          },
          tls: {
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2'
          },
          pool: true, // Use connection pooling
          maxConnections: 5,
          maxMessages: 100,
          rateDelta: 1000, // 1 second between messages
          rateLimit: 5, // Max 5 messages per rateDelta
          connectionTimeout: 10000, // 10 seconds
          greetingTimeout: 10000,
          socketTimeout: 10000,
          logger: false,
          debug: false
        });
      } 
      // Development: Use Mailtrap for testing
      else {
        logger.info('Initializing Mailtrap SMTP for development');
        
        // Check if Mailtrap credentials are available
        if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
          this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            auth: {
              user: process.env.EMAIL_USER,
              pass: emailPassword
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000
          });
        } else {
          // Fallback to Gmail in development if Mailtrap not configured
          logger.warn('Mailtrap not configured, using Gmail in development');
          this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: process.env.EMAIL_USER,
              pass: emailPassword
            },
            tls: {
              rejectUnauthorized: false // Less strict in development
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000
          });
        }
      }

      // Verify transporter configuration with timeout
      const verifyPromise = this.transporter.verify();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );

      await Promise.race([verifyPromise, timeoutPromise]);
      
      this.isConfigured = true;
      this.lastError = null;
      logger.info('✅ Email service initialized and verified successfully');
      return true;

    } catch (error) {
      this.isConfigured = false;
      this.lastError = error.message;
      logger.error('❌ Email service initialization failed:', {
        error: error.message,
        code: error.code,
        environment: process.env.NODE_ENV
      });
      return false;
    }
  }

  /**
   * Send email with proper error handling and timeout
   */
  async sendEmail(options) {
    const startTime = Date.now();

    try {
      // Initialize if not already done
      if (!this.transporter) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Email service not configured or initialization failed');
        }
      }

      // Validate required fields
      if (!options.to || !options.subject) {
        throw new Error('Email recipient and subject are required');
      }

      logger.info('📧 Sending email', {
        to: options.to,
        subject: options.subject,
        environment: process.env.NODE_ENV
      });

      // Prepare email options
      const mailOptions = {
        from: `Smart LMS <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      };

      // Send email with timeout
      const sendPromise = this.transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout')), 15000)
      );

      const info = await Promise.race([sendPromise, timeoutPromise]);
      
      const duration = Date.now() - startTime;
      logger.info('✅ Email sent successfully', {
        messageId: info.messageId,
        to: options.to,
        duration: `${duration}ms`
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('❌ Email sending failed', {
        error: error.message,
        code: error.code,
        to: options.to,
        duration: `${duration}ms`
      });

      // Provide specific error messages
      let errorMessage = error.message;
      
      if (error.code === 'EAUTH' || error.message.includes('authentication failed')) {
        errorMessage = 'Gmail authentication failed. Please check your app password.';
      } else if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
        errorMessage = 'Network error. Unable to connect to email server.';
      } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Email server is not responding.';
      } else if (error.code === 'EENVELOPE') {
        errorMessage = 'Invalid email address.';
      }

      return {
        success: false,
        error: errorMessage,
        code: error.code
      };
    }
  }

  /**
   * Send OTP email
   */
  async sendOTP(email, otp, name, organizationName = null) {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Email Verification</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering with Smart LMS${organizationName ? ` at <strong>${organizationName}</strong>` : ''}.</p>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        ${organizationName ? `<p style="color: #64748b; font-size: 14px;">Organization: <strong>${organizationName}</strong></p>` : ''}
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">Smart LMS - Learning Management System</p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - Smart LMS',
      html: emailHtml
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email, resetToken, name) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>You requested to reset your password for Smart LMS.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #64748b; word-break: break-all;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">Smart LMS - Learning Management System</p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Smart LMS',
      html: emailHtml
    });
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      lastError: this.lastError,
      environment: process.env.NODE_ENV,
      provider: process.env.NODE_ENV === 'production' ? 'Gmail' : 'Mailtrap/Gmail'
    };
  }

  /**
   * Close transporter connections
   */
  async close() {
    if (this.transporter) {
      this.transporter.close();
      logger.info('Email service connections closed');
    }
  }
}

// Export singleton instance
const emailService = new EmailService();

module.exports = emailService;
