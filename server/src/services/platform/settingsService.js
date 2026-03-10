const { SystemConfig } = require('../../models');

exports.getSettings = async () => {
  return SystemConfig.getOrCreate();
};

exports.updateSettings = async (data, userId) => {
  const config = await SystemConfig.getOrCreate();
  
  Object.assign(config, data);
  config.updatedBy = userId;
  
  await config.save();
  return config;
};
