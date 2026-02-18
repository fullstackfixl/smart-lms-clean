const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id,
    organizationId: req.user?.organization_id,
    timestamp: new Date().toISOString()
  };

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logData.statusCode = res.statusCode;
    logData.duration = `${duration}ms`;

    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

module.exports = requestLogger;
