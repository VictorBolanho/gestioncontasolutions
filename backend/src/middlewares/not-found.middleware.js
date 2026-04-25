const { StatusCodes } = require("http-status-codes");

const notFoundHandler = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
};

module.exports = { notFoundHandler };
