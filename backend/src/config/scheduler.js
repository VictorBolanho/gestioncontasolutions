const cron = require("node-cron");

const { env } = require("./env");
const { logger } = require("./logger");
const { AlertService } = require("../modules/notifications/services/alert.service");
const { syncOperationalStatuses } = require("../utils/status-sync");

let schedulerStarted = false;

const startScheduler = () => {
  if (!env.internalSchedulerEnabled || schedulerStarted) {
    return;
  }

  const alertService = new AlertService();

  cron.schedule(env.alertsCron, async () => {
    try {
      await syncOperationalStatuses();
      const result = await alertService.processAllAlerts();
      logger.info("Scheduled alert job completed", result);
    } catch (error) {
      logger.error("Scheduled alert job failed", {
        message: error.message,
        stack: error.stack
      });
    }
  });

  cron.schedule(env.overdueSyncCron, async () => {
    try {
      await syncOperationalStatuses();
      logger.info("Scheduled overdue sync completed");
    } catch (error) {
      logger.error("Scheduled overdue sync failed", {
        message: error.message,
        stack: error.stack
      });
    }
  });

  schedulerStarted = true;
  logger.info("Internal scheduler started", {
    alertsCron: env.alertsCron,
    overdueSyncCron: env.overdueSyncCron
  });
};

module.exports = { startScheduler };
