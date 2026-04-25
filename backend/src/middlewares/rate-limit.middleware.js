const rateLimit = require("express-rate-limit");
const { env } = require("../config/env");

const buildLimiter = ({ limit, windowMs = 15 * 60 * 1000, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message
    }
  });

const globalRateLimiter = buildLimiter({
  limit: env.rateLimits.global,
  message: "Too many requests globally, please try again later."
});

const authRateLimiter = buildLimiter({
  limit: env.rateLimits.auth,
  message: "Too many authentication attempts, please try again later."
});

const companiesRateLimiter = buildLimiter({
  limit: env.rateLimits.companies,
  message: "Too many company requests, please try again later."
});

const tasksRateLimiter = buildLimiter({
  limit: env.rateLimits.tasks,
  message: "Too many task requests, please try again later."
});

const reportsRateLimiter = buildLimiter({
  limit: env.rateLimits.reports,
  message: "Too many report requests, please try again later."
});

const dashboardRateLimiter = buildLimiter({
  limit: env.rateLimits.dashboard,
  message: "Too many dashboard requests, please try again later."
});

module.exports = {
  globalRateLimiter,
  authRateLimiter,
  companiesRateLimiter,
  tasksRateLimiter,
  reportsRateLimiter,
  dashboardRateLimiter
};
