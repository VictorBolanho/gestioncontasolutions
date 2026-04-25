const express = require("express");

const { SYSTEM_PERMISSIONS } = require("../../../constants/roles");
const { authenticate, authorizeAny } = require("../../../middlewares/auth.middleware");
const { reportsRateLimiter } = require("../../../middlewares/rate-limit.middleware");
const { validate } = require("../../../middlewares/validation.middleware");
const { asyncHandler } = require("../../../utils/async-handler");
const { ReportController } = require("../controllers/report.controller");
const { exportCsvSchema, tasksReportSchema } = require("../validators/report.validator");

const router = express.Router();
const controller = new ReportController();

router.use(authenticate);
router.use(reportsRateLimiter);

router.get(
  "/tasks",
  authorizeAny(SYSTEM_PERMISSIONS.REPORTS_VIEW),
  validate(tasksReportSchema),
  asyncHandler(controller.tasks)
);
router.get(
  "/companies",
  authorizeAny(SYSTEM_PERMISSIONS.REPORTS_VIEW),
  asyncHandler(controller.companies)
);
router.get(
  "/export/csv",
  authorizeAny(SYSTEM_PERMISSIONS.REPORTS_EXPORT),
  validate(exportCsvSchema),
  asyncHandler(controller.exportCsv)
);

module.exports = { reportRouter: router };
