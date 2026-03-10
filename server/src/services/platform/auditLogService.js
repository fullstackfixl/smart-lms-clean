const { PlatformAuditLog } = require('../../models');
const { paginate, getSortOptions } = require('../../utils/pagination');

exports.logAction = async (data) => {
  const log = new PlatformAuditLog(data);
  await log.save();
  return log;
};

exports.listLogs = async (params) => {
  const { action, actorId, page, limit, sort } = params;
  
  const query = {};
  if (action) query.action = action;
  if (actorId) query.actorId = actorId;
  
  const sortOptions = getSortOptions(sort);
  
  return paginate(PlatformAuditLog, query, { 
    page, 
    limit, 
    sort: sortOptions,
    populate: { path: 'actorId', select: 'name email role' }
  });
};
