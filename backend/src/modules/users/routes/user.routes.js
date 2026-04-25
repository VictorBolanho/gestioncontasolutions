const express = require("express");

const { SYSTEM_PERMISSIONS } = require("../../../constants/roles");
const { authenticate, authorizeAny } = require("../../../middlewares/auth.middleware");
const { validate } = require("../../../middlewares/validation.middleware");
const { asyncHandler } = require("../../../utils/async-handler");
const { UserController } = require("../controllers/user.controller");
const { listUsersSchema } = require("../validators/user.validator");

const router = express.Router();
const controller = new UserController();

router.use(authenticate);

router.get(
  "/",
  authorizeAny(
    SYSTEM_PERMISSIONS.USERS_MANAGE,
    SYSTEM_PERMISSIONS.COMPANIES_VIEW,
    SYSTEM_PERMISSIONS.COMPANIES_MANAGE,
    SYSTEM_PERMISSIONS.TASKS_VIEW,
    SYSTEM_PERMISSIONS.TASKS_MANAGE
  ),
  validate(listUsersSchema),
  asyncHandler(controller.list)
);

module.exports = { userRouter: router };
