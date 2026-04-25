const mongoose = require("mongoose");

const { env } = require("./env");
const { logger } = require("./logger");

const connectDatabase = async () => {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongodbUri, {
    autoIndex: env.nodeEnv !== "production",
    maxPoolSize: 20
  });

  logger.info("MongoDB connected successfully");
};

const getDatabaseHealth = () => {
  const readyStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };

  return {
    status: readyStateMap[mongoose.connection.readyState] || "unknown",
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null
  };
};

module.exports = { connectDatabase, getDatabaseHealth };
