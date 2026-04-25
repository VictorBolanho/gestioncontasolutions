const express = require("express");

const { SYSTEM_PERMISSIONS } = require("../../../constants/roles");
const { authenticate, authorizeAny } = require("../../../middlewares/auth.middleware");
const { companiesRateLimiter } = require("../../../middlewares/rate-limit.middleware");
const { validate } = require("../../../middlewares/validation.middleware");
const { asyncHandler } = require("../../../utils/async-handler");
const { TaxResponsibilityController } = require("../controllers/tax-responsibility.controller");
const {
  createTaxResponsibilitySchema,
  updateTaxResponsibilitySchema,
  taxResponsibilityParamsSchema,
  listTaxResponsibilitiesSchema
} = require("../validators/tax-responsibility.validator");

const router = express.Router();
const controller = new TaxResponsibilityController();

router.use(authenticate);
router.use(companiesRateLimiter);

router.get(
  "/",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_VIEW, SYSTEM_PERMISSIONS.COMPANIES_MANAGE),
  validate(listTaxResponsibilitiesSchema),
  asyncHandler(controller.list)
);
router.get(
  "/:responsibilityId",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_VIEW, SYSTEM_PERMISSIONS.COMPANIES_MANAGE),
  validate(taxResponsibilityParamsSchema),
  asyncHandler(controller.getById)
);
router.post(
  "/",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_EDIT, SYSTEM_PERMISSIONS.COMPANIES_MANAGE),
  validate(createTaxResponsibilitySchema),
  asyncHandler(controller.create)
);
router.patch(
  "/:responsibilityId",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_EDIT, SYSTEM_PERMISSIONS.COMPANIES_MANAGE),
  validate(updateTaxResponsibilitySchema),
  asyncHandler(controller.update)
);
router.delete(
  "/:responsibilityId",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_DELETE, SYSTEM_PERMISSIONS.COMPANIES_MANAGE),
  validate(taxResponsibilityParamsSchema),
  asyncHandler(controller.remove)
);

module.exports = { taxResponsibilityRouter: router };
