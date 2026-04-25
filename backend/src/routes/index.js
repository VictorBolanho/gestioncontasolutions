const express = require("express");

const { auditLogRouter } = require("../modules/audit-logs/routes/audit-log.routes");
const { authRouter } = require("../modules/auth/routes/auth.routes");
const { calendarRouter } = require("../modules/calendar/routes/calendar.routes");
const { companyRouter } = require("../modules/companies/routes/company.routes");
const { dashboardRouter } = require("../modules/dashboard/routes/dashboard.routes");
const { reportRouter } = require("../modules/reports/routes/report.routes");
const { taxResponsibilityRouter } = require("../modules/tax-responsibilities/routes/tax-responsibility.routes");
const { taskRouter } = require("../modules/tasks/routes/task.routes");
const { userRouter } = require("../modules/users/routes/user.routes");

const apiRouter = express.Router();

apiRouter.use("/audit-logs", auditLogRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/calendar", calendarRouter);
apiRouter.use("/companies", companyRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/reports", reportRouter);
apiRouter.use("/tax-responsibilities", taxResponsibilityRouter);
apiRouter.use("/tasks", taskRouter);
apiRouter.use("/users", userRouter);

module.exports = { apiRouter };
