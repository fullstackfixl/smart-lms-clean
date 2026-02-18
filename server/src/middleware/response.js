const responseMiddleware = (req, res, next) => {
  // Success response helper
  res.success = (data, message = 'Success') => {
    return res.json({
      success: true,
      data,
      message
    });
  };

  // Error response helper
  res.error = (error, message = 'Something went wrong', statusCode = 500) => {
    return res.status(statusCode).json({
      success: false,
      error: typeof error === 'string' ? error : error.message,
      message
    });
  };

  next();
};

module.exports = responseMiddleware;