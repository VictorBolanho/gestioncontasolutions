const dotenv = require("dotenv");
const Joi = require("joi");

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().port().default(5000),
  API_PREFIX: Joi.string().default("/api/v1"),
  CLIENT_URL: Joi.string().uri().required(),
  CLIENT_URLS: Joi.string().allow("").default(""),
  MONGODB_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default("1d"),
  PASSWORD_RESET_TOKEN_EXPIRES_MINUTES: Joi.number().integer().min(5).default(30),
  LOG_LEVEL: Joi.string().valid("error", "warn", "info", "http", "verbose", "debug").default("info"),
  RATE_LIMIT_GLOBAL_MAX: Joi.number().integer().min(10).default(300),
  RATE_LIMIT_AUTH_MAX: Joi.number().integer().min(5).default(20),
  RATE_LIMIT_COMPANIES_MAX: Joi.number().integer().min(10).default(120),
  RATE_LIMIT_TASKS_MAX: Joi.number().integer().min(10).default(180),
  RATE_LIMIT_REPORTS_MAX: Joi.number().integer().min(5).default(60),
  RATE_LIMIT_DASHBOARD_MAX: Joi.number().integer().min(10).default(120),
  INTERNAL_SCHEDULER_ENABLED: Joi.boolean().default(true),
  ALERTS_CRON: Joi.string().default("*/30 * * * *"),
  OVERDUE_SYNC_CRON: Joi.string().default("0 1 * * *"),
  SEED_SUPER_ADMIN_NAME: Joi.string().default("Super Admin"),
  SEED_SUPER_ADMIN_EMAIL: Joi.string().email().default("admin@contasolutions.com"),
  SEED_SUPER_ADMIN_PASSWORD: Joi.string().min(8).default("ContaSolutions123*")
})
  .unknown()
  .required();

const { error, value } = schema.validate(process.env, {
  abortEarly: false,
  convert: true
});

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

const env = {
  nodeEnv: value.NODE_ENV,
  port: value.PORT,
  apiPrefix: value.API_PREFIX,
  clientUrl: value.CLIENT_URL,
  clientUrls: [value.CLIENT_URL, ...value.CLIENT_URLS.split(",").map((item) => item.trim()).filter(Boolean)],
  mongodbUri: value.MONGODB_URI,
  jwtSecret: value.JWT_SECRET,
  jwtExpiresIn: value.JWT_EXPIRES_IN,
  passwordResetTokenExpiresMinutes: value.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES,
  logLevel: value.LOG_LEVEL,
  rateLimits: {
    global: value.RATE_LIMIT_GLOBAL_MAX,
    auth: value.RATE_LIMIT_AUTH_MAX,
    companies: value.RATE_LIMIT_COMPANIES_MAX,
    tasks: value.RATE_LIMIT_TASKS_MAX,
    reports: value.RATE_LIMIT_REPORTS_MAX,
    dashboard: value.RATE_LIMIT_DASHBOARD_MAX
  },
  internalSchedulerEnabled: value.INTERNAL_SCHEDULER_ENABLED,
  alertsCron: value.ALERTS_CRON,
  overdueSyncCron: value.OVERDUE_SYNC_CRON,
  seedSuperAdminName: value.SEED_SUPER_ADMIN_NAME,
  seedSuperAdminEmail: value.SEED_SUPER_ADMIN_EMAIL,
  seedSuperAdminPassword: value.SEED_SUPER_ADMIN_PASSWORD
};

module.exports = { env };
