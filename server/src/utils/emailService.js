const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

/**
 * Email Service with Template Support
 * Handles email delivery with Handlebars templating
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.templateCache = new Map();
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      // Check if email credentials are provided
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        logger.warn('Email credentials not provided, email service will be disabled');
        this.transporter = null;
        return;
      }

      // Configure transporter based on service type
      const transportConfig = {};
      
      if (process.env.EMAIL_SERVICE === 'smtp' || process.env.EMAIL_HOST) {
        // SMTP configuration (Mailtrap, custom SMTP, etc.)
        transportConfig.host = process.env.EMAIL_HOST || 'smtp.mailtrap.io';
        transportConfig.port = parseInt(process.env.EMAIL_PORT) || 2525;
        transportConfig.auth = {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        };
      } else {
        // Gmail or other service
        transportConfig.service = process.env.EMAIL_SERVICE || 'gmail';
        transportConfig.auth = {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        };
      }

      // Add connection pooling
      transportConfig.pool = true;
      transportConfig.maxConnections = 5;
      transportConfig.maxMessages = 100;
      transportConfig.rateDelta = 1000;
      transportConfig.rateLimit = 5;

      this.transporter = nodemailer.createTransport(transportConfig);

      // Verify connection (non-blocking, silent failure)
      this.transporter.verify((error, success) => {
        if (error) {
          logger.warn('Email service verification failed - emails will be disabled:', error.message);
          this.transporter = null;
        } else {
          logger.info('Email service initialized successfully');
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      this.transporter = null;
    }
  }

  /**
   * Load and compile email template
   * @param {string} templateName - Template file name
   * @returns {Function} Compiled template function
   */
  async loadTemplate(templateName) {
    try {
      // Check cache first
      if (this.templateCache.has(templateName)) {
        return this.templateCache.get(templateName);
      }

      const templatePath = path.join(__dirname, '../templates/email', `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(templateContent);
      
      // Cache the compiled template
      this.templateCache.set(templateName, compiledTemplate);
      
      return compiledTemplate;
    } catch (error) {
      logger.error(`Failed to load template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  /**
   * Send email with template
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.templateName - Template name
   * @param {Object} options.data - Template data
   * @param {string} options.subject - Email subject (optional, can be in template)
   * @param {number} options.retries - Number of retries (default: 3)
   */
  async sendTemplatedEmail(options) {
    const { to, templateName, data, subject, retries = 3 } = options;
    
    // Check if email service is available
    if (!this.transporter) {
      logger.warn('Email service not available, skipping email send', { to, templateName });
      return {
        success: false,
        error: 'Email service not configured',
        skipped: true
      };
    }
    
    let attempt = 0;
    let lastError;

    while (attempt < retries) {
      try {
        // Load and compile template
        const template = await this.loadTemplate(templateName);
        
        // Render template with data
        const html = template({
          ...data,
          currentYear: new Date().getFullYear(),
          organizationName: data.organizationName || 'Smart LMS'
        });

        // Extract subject from template if not provided
        const emailSubject = subject || this.extractSubjectFromTemplate(html) || 'Notification from Smart LMS';

        // Send email
        const result = await this.transporter.sendMail({
          from: `"${data.organizationName || 'Smart LMS'}" <${process.env.EMAIL_USER}>`,
          to: to,
          subject: emailSubject,
          html: html,
          text: this.htmlToText(html)
        });

        logger.info(`Email sent successfully to ${to}`, {
          messageId: result.messageId,
          template: templateName,
          attempt: attempt + 1
        });

        return {
          success: true,
          messageId: result.messageId,
          attempt: attempt + 1
        };

      } catch (error) {
        attempt++;
        lastError = error;
        
        logger.warn(`Email send attempt ${attempt} failed for ${to}:`, {
          error: error.message,
          template: templateName,
          attempt
        });

        if (attempt < retries) {
          // Exponential backoff: wait 2^attempt seconds
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    logger.error(`Failed to send email to ${to} after ${retries} attempts:`, lastError);
    throw lastError;
  }

  /**
   * Send plain email without template
   * @param {Object} options - Email options
   */
  async sendPlainEmail(options) {
    const { to, subject, text, html, retries = 3 } = options;
    
    // Check if email service is available
    if (!this.transporter) {
      logger.warn('Email service not available, skipping email send', { to, subject });
      return {
        success: false,
        error: 'Email service not configured',
        skipped: true
      };
    }
    
    let attempt = 0;
    let lastError;

    while (attempt < retries) {
      try {
        const result = await this.transporter.sendMail({
          from: `"Smart LMS" <${process.env.EMAIL_USER}>`,
          to: to,
          subject: subject,
          text: text,
          html: html
        });

        logger.info(`Plain email sent successfully to ${to}`, {
          messageId: result.messageId,
          attempt: attempt + 1
        });

        return {
          success: true,
          messageId: result.messageId,
          attempt: attempt + 1
        };

      } catch (error) {
        attempt++;
        lastError = error;
        
        logger.warn(`Plain email send attempt ${attempt} failed for ${to}:`, error.message);

        if (attempt < retries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    logger.error(`Failed to send plain email to ${to} after ${retries} attempts:`, lastError);
    throw lastError;
  }

  /**
   * Send bulk emails with rate limiting
   * @param {Array} emails - Array of email objects
   * @param {number} batchSize - Batch size for sending (default: 10)
   * @param {number} delayBetweenBatches - Delay between batches in ms (default: 1000)
   */
  async sendBulkEmails(emails, batchSize = 10, delayBetweenBatches = 1000) {
    const results = [];
    const batches = this.chunkArray(emails, batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      logger.info(`Processing email batch ${i + 1}/${batches.length} (${batch.length} emails)`);

      const batchPromises = batch.map(async (email) => {
        try {
          if (email.templateName) {
            return await this.sendTemplatedEmail(email);
          } else {
            return await this.sendPlainEmail(email);
          }
        } catch (error) {
          return {
            success: false,
            error: error.message,
            email: email.to
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
      ));

      // Delay between batches to respect rate limits
      if (i < batches.length - 1) {
        await this.delay(delayBetweenBatches);
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    logger.info(`Bulk email sending completed: ${successful} successful, ${failed} failed`);

    return {
      total: results.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Extract subject from HTML template (looks for <title> tag)
   * @param {string} html - HTML content
   * @returns {string|null} Extracted subject
   */
  extractSubjectFromTemplate(html) {
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  /**
   * Convert HTML to plain text (basic implementation)
   * @param {string} html - HTML content
   * @returns {string} Plain text
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Utility function to create delay
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Utility function to chunk array into smaller arrays
   * @param {Array} array - Array to chunk
   * @param {number} size - Chunk size
   * @returns {Array} Array of chunks
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    try {
      if (!this.transporter) {
        return { success: false, error: 'Email service not configured' };
      }
      
      await this.transporter.verify();
      return { success: true, message: 'Email service connection successful' };
    } catch (error) {
      logger.error('Email service connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get email service statistics
   */
  getStats() {
    return {
      templatesLoaded: this.templateCache.size,
      transporterReady: !!this.transporter
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;