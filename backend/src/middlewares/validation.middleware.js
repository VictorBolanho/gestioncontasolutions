const { StatusCodes } = require("http-status-codes");

const { AppError } = require("../utils/app-error");

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(
    {
      body: req.body,
      params: req.params,
      query: req.query
    },
    {
      abortEarly: false,
      stripUnknown: true
    }
  );

  if (error) {
    return next(
      new AppError("Validation error", StatusCodes.BAD_REQUEST, error.details.map((detail) => detail.message))
    );
  }

  req.body = value.body || {};
  req.params = value.params || {};
  req.query = value.query || {};

  return next();
};

module.exports = { validate };
