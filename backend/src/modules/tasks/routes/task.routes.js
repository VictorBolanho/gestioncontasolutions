const express = require("express");

const { SYSTEM_PERMISSIONS } = require("../../../constants/roles");
const { authenticate, authorizeAny } = require("../../../middlewares/auth.middleware");
const { tasksRateLimiter } = require("../../../middlewares/rate-limit.middleware");
const { validate } = require("../../../middlewares/validation.middleware");
const { asyncHandler } = require("../../../utils/async-handler");
const { TaskController } = require("../controllers/task.controller");
const {
  createTaskSchema,
  updateTaskSchema,
  taskParamsSchema,
  listTasksSchema
} = require("../validators/task.validator");

const router = express.Router();
const controller = new TaskController();

router.use(authenticate);
router.use(tasksRateLimiter);

router.get(
  "/",
  authorizeAny(SYSTEM_PERMISSIONS.TASKS_VIEW, SYSTEM_PERMISSIONS.TASKS_MANAGE),
  validate(listTasksSchema),
  asyncHandler(controller.list)
);
router.get(
  "/counters",
  authorizeAny(SYSTEM_PERMISSIONS.TASKS_VIEW, SYSTEM_PERMISSIONS.TASKS_MANAGE),
  asyncHandler(controller.getCounters)
);
router.get(
  "/:taskId",
  authorizeAny(SYSTEM_PERMISSIONS.TASKS_VIEW, SYSTEM_PERMISSIONS.TASKS_MANAGE),
  validate(taskParamsSchema),
  asyncHandler(controller.getById)
);
router.post(
  "/",
  authorizeAny(SYSTEM_PERMISSIONS.TASKS_CREATE, SYSTEM_PERMISSIONS.TASKS_MANAGE),
  validate(createTaskSchema),
  asyncHandler(controller.create)
);
router.patch(
  "/:taskId",
  authorizeAny(
    SYSTEM_PERMISSIONS.TASKS_EDIT,
    SYSTEM_PERMISSIONS.TASKS_ASSIGN,
    SYSTEM_PERMISSIONS.TASKS_MANAGE
  ),
  validate(updateTaskSchema),
  asyncHandler(controller.update)
);
router.delete(
  "/:taskId",
  authorizeAny(SYSTEM_PERMISSIONS.TASKS_DELETE, SYSTEM_PERMISSIONS.TASKS_MANAGE),
  validate(taskParamsSchema),
  asyncHandler(controller.remove)
);

module.exports = { taskRouter: router };
