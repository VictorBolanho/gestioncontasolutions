const { createLogger, format, transports } = require("winston");
const { env } = require("./env");

const logger = createLogger({
  level: env.logLevel,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: "contasolutions-api" },
  transports: [new transports.Console()]
});

const morganStream = {
  write: (message, context = {}) => {
    logger.http(message.trim(), context);
  }
};

module.exports = { logger, morganStream };
