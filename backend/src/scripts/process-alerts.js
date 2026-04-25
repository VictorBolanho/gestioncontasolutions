const { connectDatabase } = require("../config/database");
const { logger } = require("../config/logger");
const { AlertService } = require("../modules/notifications/services/alert.service");
const { TaskService } = require("../modules/tasks/services/task.service");

const run = async () => {
  await connectDatabase();

  const taskService = new TaskService();
  const alertService = new AlertService();

  await taskService.markOverdueTasks();
  const result = await alertService.processAllAlerts();

  logger.info("Alerts processed successfully", result);
  process.exit(0);
};

run().catch((error) => {
  logger.error("Alerts processing failed", { message: error.message, stack: error.stack });
  process.exit(1);
});
