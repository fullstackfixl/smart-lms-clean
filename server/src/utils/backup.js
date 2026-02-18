const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');

/**
 * Backup and Disaster Recovery Utilities
 */

class BackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
  }

  /**
   * Create MongoDB backup
   * @returns {Promise<string>} Backup file path
   */
  async createMongoBackup() {
    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `mongodb-backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);

      const mongoUri = process.env.MONGODB_URI;
      const dbName = this.extractDbName(mongoUri);

      // Create backup using mongodump
      const command = `mongodump --uri="${mongoUri}" --out="${backupPath}" --gzip`;

      await this.executeCommand(command);

      logger.info('MongoDB backup created successfully', {
        backupPath,
        timestamp
      });

      // Cleanup old backups
      await this.cleanupOldBackups();

      return backupPath;
    } catch (error) {
      logger.error('MongoDB backup failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Restore MongoDB backup
   * @param {string} backupPath - Path to backup directory
   * @returns {Promise<void>}
   */
  async restoreMongoBackup(backupPath) {
    try {
      const mongoUri = process.env.MONGODB_URI;

      // Restore using mongorestore
      const command = `mongorestore --uri="${mongoUri}" --gzip --drop "${backupPath}"`;

      await this.executeCommand(command);

      logger.info('MongoDB restore completed successfully', {
        backupPath
      });
    } catch (error) {
      logger.error('MongoDB restore failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Create file system backup (uploads, logs, etc.)
   * @returns {Promise<string>} Backup file path
   */
  async createFileSystemBackup() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `filesystem-backup-${timestamp}.tar.gz`;
      const backupPath = path.join(this.backupDir, backupName);

      const sourceDirs = [
        path.join(__dirname, '../../uploads'),
        path.join(__dirname, '../../logs')
      ];

      // Create tar.gz archive
      const command = `tar -czf "${backupPath}" ${sourceDirs.map(d => `"${d}"`).join(' ')}`;

      await this.executeCommand(command);

      logger.info('File system backup created successfully', {
        backupPath,
        timestamp
      });

      await this.cleanupOldBackups();

      return backupPath;
    } catch (error) {
      logger.error('File system backup failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Create full system backup (MongoDB + Files)
   * @returns {Promise<{mongoBackup: string, fileBackup: string}>}
   */
  async createFullBackup() {
    try {
      logger.info('Starting full system backup');

      const mongoBackup = await this.createMongoBackup();
      const fileBackup = await this.createFileSystemBackup();

      logger.info('Full system backup completed', {
        mongoBackup,
        fileBackup
      });

      return { mongoBackup, fileBackup };
    } catch (error) {
      logger.error('Full system backup failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Cleanup old backups based on retention policy
   * @returns {Promise<void>}
   */
  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const now = Date.now();
      const retentionMs = this.retentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > retentionMs) {
          await fs.rm(filePath, { recursive: true, force: true });
          logger.info('Old backup deleted', { file, age: Math.floor((now - stats.mtimeMs) / (24 * 60 * 60 * 1000)) + ' days' });
        }
      }
    } catch (error) {
      logger.error('Backup cleanup failed', { error: error.message });
    }
  }

  /**
   * List available backups
   * @returns {Promise<Array>}
   */
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);

        backups.push({
          name: file,
          path: filePath,
          size: stats.size,
          created: stats.mtime,
          type: file.includes('mongodb') ? 'database' : 'filesystem'
        });
      }

      return backups.sort((a, b) => b.created - a.created);
    } catch (error) {
      logger.error('Failed to list backups', { error: error.message });
      return [];
    }
  }

  /**
   * Execute shell command
   * @param {string} command
   * @returns {Promise<string>}
   */
  executeCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Command failed: ${error.message}\n${stderr}`));
        } else {
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Extract database name from MongoDB URI
   * @param {string} uri
   * @returns {string}
   */
  extractDbName(uri) {
    const match = uri.match(/\/([^/?]+)(\?|$)/);
    return match ? match[1] : 'smart-lms';
  }

  /**
   * Schedule automatic backups
   * @param {string} schedule - Cron schedule (e.g., '0 2 * * *' for daily at 2 AM)
   */
  scheduleBackups(schedule = '0 2 * * *') {
    const cron = require('node-cron');

    cron.schedule(schedule, async () => {
      logger.info('Scheduled backup started');
      try {
        await this.createFullBackup();
        logger.info('Scheduled backup completed successfully');
      } catch (error) {
        logger.error('Scheduled backup failed', { error: error.message });
      }
    });

    logger.info('Backup schedule configured', { schedule });
  }
}

module.exports = new BackupService();
