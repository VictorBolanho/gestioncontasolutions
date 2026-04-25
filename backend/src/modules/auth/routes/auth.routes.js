const express = require("express");

const { SYSTEM_PERMISSIONS } = require("../../../constants/roles");
const { authenticate, authorize } = require("../../../middlewares/auth.middleware");
const { authRateLimiter } = require("../../../middlewares/rate-limit.middleware");
const { validate } = require("../../../middlewares/validation.middleware");
const { asyncHandler } = require("../../../utils/async-handler");
const { AuthController } = require("../controllers/auth.controller");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require("../validators/auth.validator");

const router = express.Router();
const controller = new AuthController();

router.post("/login", authRateLimiter, validate(loginSchema), asyncHandler(controller.login));
router.post("/forgot-password", authRateLimiter, validate(forgotPasswordSchema), asyncHandler(controller.forgotPassword));
router.post("/reset-password", authRateLimiter, validate(resetPasswordSchema), asyncHandler(controller.resetPassword));
router.get("/me", authenticate, asyncHandler(controller.me));
router.post(
  "/register",
  authenticate,
  authRateLimiter,
  authorize(SYSTEM_PERMISSIONS.USERS_MANAGE),
  validate(registerSchema),
  asyncHandler(controller.register)
);

module.exports = { authRouter: router };
