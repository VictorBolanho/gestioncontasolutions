const compression = require("compression");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

const { getDatabaseHealth } = require("./config/database");
const { env } = require("./config/env");
const { logger, morganStream } = require("./config/logger");
const { apiRouter } = require("./routes");
const { errorHandler } = require("./middlewares/error.middleware");
const { notFoundHandler } = require("./middlewares/not-found.middleware");
const { requestContext } = require("./middlewares/request-context.middleware");
const { globalRateLimiter } = require("./middlewares/rate-limit.middleware");
const { sanitizeMongo, sanitizeXss } = require("./middlewares/security.middleware");

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.clientUrls.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true
  })
);
app.use(helmet());
app.use(compression());
app.use(requestContext);
app.use(sanitizeMongo);
app.use(sanitizeXss);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

morgan.token("request-id", (req) => req.requestId);
morgan.token("user-id", (req) => req.user?._id?.toString?.() || "anonymous");
app.use(
  morgan(":method :url :status :response-time ms reqId=:request-id user=:user-id", {
    stream: {
      write: (message) =>
        morganStream.write(message, {
          type: "access-log"
        })
    }
  })
);
app.use(globalRateLimiter);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ContaSolutions API is healthy",
    environment: env.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

app.get("/health/details", (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.status(200).json({
    success: true,
    message: "ContaSolutions detailed health check",
    data: {
      uptime: process.uptime(),
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external
      },
      version: process.version,
      environment: env.nodeEnv,
      database: getDatabaseHealth(),
      timestamp: new Date().toISOString()
    }
  });
});

app.use(env.apiPrefix, apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { message: error.message, stack: error.stack });
});

module.exports = { app };
