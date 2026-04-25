const { StatusCodes } = require("http-status-codes");

const { env } = require("../config/env");
const { logger } = require("../config/logger");

const errorHandler = (error, req, res, next) => {
  void next;
  let normalizedError = error;

  if (error.name === "ValidationError") {
    normalizedError = {
      ...error,
      statusCode: StatusCodes.BAD_REQUEST,
      details: Object.values(error.errors || {}).map((item) => item.message)
    };
  }

  if (error.code === 11000) {
    normalizedError = {
      ...error,
      statusCode: StatusCodes.CONFLICT,
      message: "Duplicate value detected",
      details: error.keyValue || null
    };
  }

  const statusCode = normalizedError.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  logger.error("Request failed", {
    requestId: req.requestId,
    path: req.originalUrl,
    method: req.method,
    statusCode,
    message: normalizedError.message,
    details: normalizedError.details,
    stack: normalizedError.stack
  });

  return res.status(statusCode).json({
    success: false,
    message: normalizedError.message || "Internal server error",
    details: normalizedError.details || null,
    stack: env.nodeEnv === "development" ? normalizedError.stack : undefined
  });
};

module.exports = { errorHandler };
