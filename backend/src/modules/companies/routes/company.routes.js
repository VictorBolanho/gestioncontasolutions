const express = require("express");

const { SYSTEM_PERMISSIONS } = require("../../../constants/roles");
const { authenticate, authorizeAny } = require("../../../middlewares/auth.middleware");
const { companiesRateLimiter } = require("../../../middlewares/rate-limit.middleware");
const { validate } = require("../../../middlewares/validation.middleware");
const { asyncHandler } = require("../../../utils/async-handler");
const { CompanyController } = require("../controllers/company.controller");
const {
  createCompanySchema,
  createCompanyWithResponsibilitiesSchema,
  updateCompanySchema,
  companyParamsSchema,
  listCompaniesSchema
} = require("../validators/company.validator");

const router = express.Router();
const controller = new CompanyController();

router.use(authenticate);
router.use(companiesRateLimiter);

router.get(
  "/",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_VIEW, SYSTEM_PERMISSIONS.COMPANIES_MANAGE),
  validate(listCompaniesSchema),
  asyncHandler(controller.list)
);
router.get(
  "/:companyId",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_VIEW, SYSTEM_PERMISSIONS.COMPANIES_MANAGE),
  validate(companyParamsSchema),
  asyncHandler(controller.getById)
);
router.post(
  "/",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_CREATE, SYSTEM_PERMISSIONS.COMPANIES_MANAGE),
  validate(createCompanySchema),
  asyncHandler(controller.create)
);
router.post(
  "/with-responsibilities",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_CREATE, SYSTEM_PERMISSIONS.COMPANIES_MANAGE),
  validate(createCompanyWithResponsibilitiesSchema),
  asyncHandler(controller.createWithResponsibilities)
);
router.patch(
  "/:companyId",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_EDIT, SYSTEM_PERMISSIONS.COMPANIES_MANAGE),
  validate(updateCompanySchema),
  asyncHandler(controller.update)
);
router.delete(
  "/:companyId",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_DELETE, SYSTEM_PERMISSIONS.COMPANIES_MANAGE),
  validate(companyParamsSchema),
  asyncHandler(controller.remove)
);

module.exports = { companyRouter: router };
