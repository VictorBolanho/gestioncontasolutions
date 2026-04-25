const express = require("express");

const { SYSTEM_PERMISSIONS } = require("../../../constants/roles");
const { authenticate, authorizeAny } = require("../../../middlewares/auth.middleware");
const { validate } = require("../../../middlewares/validation.middleware");
const { asyncHandler } = require("../../../utils/async-handler");
const { AuditLogController } = require("../controllers/audit-log.controller");
const { listAuditLogsSchema } = require("../validators/audit-log.validator");

const router = express.Router();
const controller = new AuditLogController();

router.use(authenticate);

router.get(
  "/",
  authorizeAny(
    SYSTEM_PERMISSIONS.AUDIT_VIEW,
    SYSTEM_PERMISSIONS.COMPANIES_VIEW,
    SYSTEM_PERMISSIONS.COMPANIES_MANAGE,
    SYSTEM_PERMISSIONS.REPORTS_VIEW
  ),
  validate(listAuditLogsSchema),
  asyncHandler(controller.list)
);

module.exports = { auditLogRouter: router };
