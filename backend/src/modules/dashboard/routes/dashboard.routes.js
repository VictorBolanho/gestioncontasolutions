const express = require("express");

const { SYSTEM_PERMISSIONS } = require("../../../constants/roles");
const { authenticate, authorizeAny } = require("../../../middlewares/auth.middleware");
const { dashboardRateLimiter } = require("../../../middlewares/rate-limit.middleware");
const { asyncHandler } = require("../../../utils/async-handler");
const { DashboardController } = require("../controllers/dashboard.controller");

const router = express.Router();
const controller = new DashboardController();

router.use(authenticate);
router.use(dashboardRateLimiter);

router.get(
  "/overview",
  authorizeAny(SYSTEM_PERMISSIONS.DASHBOARD_VIEW),
  asyncHandler(controller.overview)
);
router.get(
  "/workload",
  authorizeAny(SYSTEM_PERMISSIONS.DASHBOARD_VIEW),
  asyncHandler(controller.workload)
);
router.get(
  "/compliance",
  authorizeAny(SYSTEM_PERMISSIONS.DASHBOARD_VIEW),
  asyncHandler(controller.compliance)
);

module.exports = { dashboardRouter: router };
