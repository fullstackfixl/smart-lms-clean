const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const crypto = require('crypto');
const { sendEmail } = require('./mailer');
const emailTemplates = require('./email.service');

/**
 * Multi-Factor Authentication Service
 * Implements TOTP-based 2FA
 */

class MFAService {
  /**
   * Generate MFA secret for user
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @returns {Promise<{secret, qrCode, backupCodes}>}
   */
  async generateMFASecret(userId, email) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Smart LMS (${email})`,
      issuer: 'Smart LMS',
      length: 32
    });

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(8);
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => this.hashBackupCode(code))
    );

    // Store secret temporarily (not enabled until verified)
    user.mfa_secret = secret.base32;
    user.mfa_backup_codes = hashedBackupCodes;
    user.mfa_enabled = false; // Will be enabled after verification
    await user.save();

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
      backupCodes // Return plain codes to user (only shown once)
    };
  }

  /**
   * Verify MFA token and enable MFA
   * @param {string} userId - User ID
   * @param {string} token - 6-digit TOTP token
   * @returns {Promise<boolean>}
   */
  async verifyAndEnableMFA(userId, token) {
    const user = await User.findById(userId).select('+mfa_secret');
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.mfa_secret) {
      throw new Error('MFA not set up. Please generate a secret first.');
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps before/after
    });

    if (!verified) {
      throw new Error('Invalid MFA token');
    }

    // Enable MFA
    user.mfa_enabled = true;
    await user.save();

    return true;
  }

  /**
   * Verify MFA token during login
   * @param {string} userId - User ID
   * @param {string} token - 6-digit TOTP token or backup code
   * @returns {Promise<boolean>}
   */
  async verifyMFAToken(userId, token) {
    const user = await User.findById(userId).select('+mfa_secret +mfa_backup_codes');
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.mfa_enabled) {
      throw new Error('MFA is not enabled for this user');
    }

    // Try TOTP verification first
    const totpVerified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (totpVerified) {
      return true;
    }

    // Try backup code verification
    if (user.mfa_backup_codes && user.mfa_backup_codes.length > 0) {
      for (let i = 0; i < user.mfa_backup_codes.length; i++) {
        const isMatch = await this.verifyBackupCode(token, user.mfa_backup_codes[i]);
        if (isMatch) {
          // Remove used backup code
          user.mfa_backup_codes.splice(i, 1);
          await user.save();
          return true;
        }
      }
    }

    throw new Error('Invalid MFA token or backup code');
  }

  /**
   * Disable MFA for user
   * @param {string} userId - User ID
   * @param {string} password - User password for verification
   * @returns {Promise<boolean>}
   */
  async disableMFA(userId, password) {
    const user = await User.findById(userId).select('+password_hash +mfa_secret +mfa_backup_codes');
    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Disable MFA
    user.mfa_enabled = false;
    user.mfa_secret = undefined;
    user.mfa_backup_codes = undefined;
    await user.save();

    return true;
  }

  /**
   * Regenerate backup codes
   * @param {string} userId - User ID
   * @param {string} password - User password for verification
   * @returns {Promise<string[]>}
   */
  async regenerateBackupCodes(userId, password) {
    const user = await User.findById(userId).select('+password_hash');
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.mfa_enabled) {
      throw new Error('MFA is not enabled');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes(8);
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => this.hashBackupCode(code))
    );

    user.mfa_backup_codes = hashedBackupCodes;
    await user.save();

    return backupCodes;
  }

  /**
   * Generate backup codes
   * @param {number} count - Number of codes to generate
   * @returns {string[]}
   */
  generateBackupCodes(count = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Hash backup code
   * @param {string} code - Backup code
   * @returns {Promise<string>}
   */
  async hashBackupCode(code) {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(code, salt);
  }

  /**
   * Verify backup code
   * @param {string} code - Plain backup code
   * @param {string} hash - Hashed backup code
   * @returns {Promise<boolean>}
   */
  async verifyBackupCode(code, hash) {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(code, hash);
  }

  /**
   * Check if user has MFA enabled
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async isMFAEnabled(userId) {
    const user = await User.findById(userId);
    return user && user.mfa_enabled === true;
  }
  async sendOTPEmail(email, token) {
    const html = emailTemplates.generateOtpTemplate(token);
    return sendEmail(email, 'Your Smart LMS Authentication Code', html);
  }
}

module.exports = new MFAService();
