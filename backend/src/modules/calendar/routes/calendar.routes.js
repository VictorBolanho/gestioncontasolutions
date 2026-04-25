const express = require("express");

const { SYSTEM_PERMISSIONS } = require("../../../constants/roles");
const { authenticate, authorizeAny } = require("../../../middlewares/auth.middleware");
const { tasksRateLimiter } = require("../../../middlewares/rate-limit.middleware");
const { validate } = require("../../../middlewares/validation.middleware");
const { asyncHandler } = require("../../../utils/async-handler");
const { CalendarController } = require("../controllers/calendar.controller");
const { calendarEventsSchema } = require("../validators/calendar.validator");

const router = express.Router();
const controller = new CalendarController();

router.use(authenticate);
router.use(tasksRateLimiter);

router.get(
  "/events",
  authorizeAny(
    SYSTEM_PERMISSIONS.TASKS_VIEW,
    SYSTEM_PERMISSIONS.TASKS_MANAGE,
    SYSTEM_PERMISSIONS.COMPANIES_VIEW,
    SYSTEM_PERMISSIONS.COMPANIES_MANAGE
  ),
  validate(calendarEventsSchema),
  asyncHandler(controller.getEvents)
);

module.exports = { calendarRouter: router };
