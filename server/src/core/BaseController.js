class BaseController {
  constructor(service) {
    this.service = service;
  }

  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  sendSuccess(res, data, message = 'Success', statusCode = 200) {
    res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  sendError(res, message, statusCode = 400) {
    res.status(statusCode).json({
      success: false,
      error: message
    });
  }
}

module.exports = BaseController;
