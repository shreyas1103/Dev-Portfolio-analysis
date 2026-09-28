const { AppError } = require("../errors/AppError");

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.reason && { reason: err.reason }),
        ...(err.daysTracked !== undefined && { daysTracked: err.daysTracked }),
        ...(err.daysRequired !== undefined && { daysRequired: err.daysRequired }),
      },
    });
  }

  console.error(err);

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong",
    },
  });
}

module.exports = errorHandler;