const analyticsService = require('../../services/platform/analyticsService');

exports.getOverview = async (req, res) => {
  try {
    const overview = await analyticsService.getOverview();
    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'ANALYTICS_OVERVIEW_ERROR'
    });
  }
};

exports.getGrowth = async (req, res) => {
  try {
    const growth = await analyticsService.getGrowth();
    res.status(200).json({
      success: true,
      data: growth
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'ANALYTICS_GROWTH_ERROR'
    });
  }
};
