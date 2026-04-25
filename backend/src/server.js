const http = require("http");

const { connectDatabase } = require("./config/database");
const { env } = require("./config/env");
const { logger } = require("./config/logger");
const { startScheduler } = require("./config/scheduler");
const { app } = require("./app");

const startServer = async () => {
  await connectDatabase();

  const server = http.createServer(app);

  startScheduler();

  server.listen(env.port, () => {
    logger.info(`ContaSolutions backend listening on port ${env.port}`);
  });

  const shutdown = (signal) => {
    logger.warn(`Received ${signal}. Closing server gracefully.`);
    server.close(() => {
      logger.info("HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer().catch((error) => {
  logger.error("Failed to start server", { message: error.message, stack: error.stack });
  process.exit(1);
});
