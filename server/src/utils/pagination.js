/**
 * Pagination and Filtering Utility
 */
exports.paginate = async (model, query = {}, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = options.sort || { created_at: -1 };

  const [data, total] = await Promise.all([
    (() => {
      let q = model.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      if (options.select) q = q.select(options.select);
      if (options.populate) q = q.populate(options.populate);
      return q.lean();
    })(),
    model.countDocuments(query)
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

exports.getSortOptions = (sortStr) => {
  if (!sortStr) return { created_at: -1 };
  
  const parts = sortStr.split(':');
  const field = parts[0];
  const order = parts[1] === 'asc' ? 1 : -1;
  
  return { [field]: order };
};
