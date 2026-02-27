const emailService = require('../services/emailService');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

/**
 * Email Service with Template Support (Legacy Wrapper)
 * Now routes through services/emailService for Brevo API support
 */
class LegacyEmailService {
  constructor() {
    this.templateCache = new Map();
  }

  /**
   * Load and compile email template
   */
  async loadTemplate(templateName) {
    try {
      if (this.templateCache.has(templateName)) {
        return this.templateCache.get(templateName);
      }

      const templatePath = path.join(__dirname, '../templates/email', `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(templateContent);
      this.templateCache.set(templateName, compiledTemplate);
      return compiledTemplate;
    } catch (error) {
      logger.error(`Failed to load template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  /**
   * Send email with template
   */
  async sendTemplatedEmail(options) {
    const { to, templateName, data, subject } = options;
    try {
      const template = await this.loadTemplate(templateName);
      const html = template({
        ...data,
        currentYear: new Date().getFullYear(),
        organizationName: data.organizationName || 'Smart LMS'
      });

      const emailSubject = subject || this.extractSubjectFromTemplate(html) || 'Notification from Smart LMS';
      const text = this.htmlToText(html);

      return {
        success: await emailService.sendEmail(to, emailSubject, text, html)
      };
    } catch (error) {
      logger.error(`Failed to send templated email to ${to}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send plain email without template
   */
  async sendPlainEmail(options) {
    const { to, subject, text, html } = options;
    const success = await emailService.sendEmail(to, subject, text, html || text);
    return { success };
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails, batchSize = 10, delayBetweenBatches = 1000) {
    let successful = 0;
    for (const email of emails) {
      const res = await (email.templateName ? this.sendTemplatedEmail(email) : this.sendPlainEmail(email));
      if (res.success) successful++;
    }
    return {
      total: emails.length,
      successful,
      failed: emails.length - successful
    };
  }

  extractSubjectFromTemplate(html) {
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  htmlToText(html) {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }
}

module.exports = new LegacyEmailService();
