const SystemConfig = require('../../models/SystemConfig');
const AuditLog = require('../../models/AuditLog');

/**
 * Platform Settings Service
 * Manages global institutional protocols and platform preferences
 */
class SettingsService {
  /**
   * Retrieve global configuration payload
   */
  async getSettings() {
    return SystemConfig.getOrCreate();
  }

  /**
   * Update system-wide configuration
   */
  async updateSettings(data, actor) {
    const config = await SystemConfig.getOrCreate();
    
    // Update fields
    if (data.maintenanceMode !== undefined) config.maintenanceMode = data.maintenanceMode;
    if (data.maxOrganizations !== undefined) config.maxOrganizations = data.maxOrganizations;
    if (data.features) config.features = { ...config.features, ...data.features };
    
    config.updatedBy = actor._id;
    await config.save();

    await AuditLog.create({
      user_id: actor._id,
      user_email: actor.email,
      user_role: actor.role,
      action: 'UPDATE',
      resource: 'config',
      resource_id: config._id.toString(),
      details: data
    });

    return config;
  }
}

module.exports = new SettingsService();
