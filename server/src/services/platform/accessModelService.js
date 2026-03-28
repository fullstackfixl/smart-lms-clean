const { SystemConfig } = require('../../models');
const {
  PLATFORM_PERMISSION_CATALOG,
  DEFAULT_FEATURE_TOGGLES,
  ORGANIZATION_TYPES,
  ORGANIZATION_SERVICE_FLAGS,
  PLATFORM_SIDEBAR_SECTIONS,
  ROLE_PERMISSION_MATRIX
} = require('../../config/platformAccessCatalog');

function mergeFeatures(configFeatures = {}) {
  return {
    ...DEFAULT_FEATURE_TOGGLES,
    ...(configFeatures || {})
  };
}

exports.getAccessModel = async () => {
  const config = await SystemConfig.getOrCreate();

  return {
    catalog: PLATFORM_PERMISSION_CATALOG,
    organizationTypes: ORGANIZATION_TYPES,
    organizationServices: ORGANIZATION_SERVICE_FLAGS,
    sidebarSections: PLATFORM_SIDEBAR_SECTIONS,
    roleMatrix: ROLE_PERMISSION_MATRIX,
    featureToggles: mergeFeatures(config.features),
    systemConfig: {
      id: config._id,
      platformName: config.platformName,
      supportEmail: config.supportEmail,
      maintenanceMode: config.maintenanceMode,
      registrationEnabled: config.registrationEnabled,
      emailVerificationRequired: config.emailVerificationRequired,
      maxOrganizations: config.maxOrganizations,
      defaultPlan: config.defaultPlan
    }
  };
};

exports.updateFeatureToggles = async (payload = {}, updatedBy) => {
  const config = await SystemConfig.getOrCreate();
  const nextFeatures = mergeFeatures(config.features);
  const source = payload.features && typeof payload.features === 'object' ? payload.features : payload;

  Object.keys(DEFAULT_FEATURE_TOGGLES).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      nextFeatures[key] = Boolean(source[key]);
    }
  });

  config.features = nextFeatures;
  config.updatedBy = updatedBy;
  await config.save();

  return {
    configId: config._id,
    featureToggles: nextFeatures,
    updatedAt: config.updated_at
  };
};
