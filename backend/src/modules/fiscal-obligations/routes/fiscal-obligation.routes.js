const express = require("express");

const { SYSTEM_PERMISSIONS } = require("../../../constants/roles");
const { authenticate, authorizeAny } = require("../../../middlewares/auth.middleware");
const { companiesRateLimiter } = require("../../../middlewares/rate-limit.middleware");
const { validate } = require("../../../middlewares/validation.middleware");
const { asyncHandler } = require("../../../utils/async-handler");
const { FiscalObligationController } = require("../controllers/fiscal-obligation.controller");
const {
  createFiscalObligationSchema,
  updateFiscalObligationSchema,
  fiscalObligationParamsSchema,
  generateFiscalObligationsSchema,
  listFiscalObligationsSchema,
  upcomingFiscalObligationsSchema
} = require("../validators/fiscal-obligation.validator");

const router = express.Router();
const controller = new FiscalObligationController();

router.use(authenticate);
router.use(companiesRateLimiter);

router.get(
  "/",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_VIEW, SYSTEM_PERMISSIONS.COMPANIES_MANAGE),
  validate(listFiscalObligationsSchema),
  asyncHandler(controller.list)
);
router.get(
  "/upcoming",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_VIEW, SYSTEM_PERMISSIONS.COMPANIES_MANAGE, SYSTEM_PERMISSIONS.DASHBOARD_VIEW),
  validate(upcomingFiscalObligationsSchema),
  asyncHandler(controller.upcoming)
);
router.get(
  "/clients-at-risk",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_VIEW, SYSTEM_PERMISSIONS.COMPANIES_MANAGE, SYSTEM_PERMISSIONS.DASHBOARD_VIEW),
  asyncHandler(controller.clientsAtRisk)
);
router.post(
  "/generate/company/:companyId",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_EDIT, SYSTEM_PERMISSIONS.COMPANIES_MANAGE),
  validate(generateFiscalObligationsSchema),
  asyncHandler(controller.generateForCompany)
);
router.get(
  "/:obligationId",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_VIEW, SYSTEM_PERMISSIONS.COMPANIES_MANAGE),
  validate(fiscalObligationParamsSchema),
  asyncHandler(controller.getById)
);
router.post(
  "/",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_EDIT, SYSTEM_PERMISSIONS.COMPANIES_MANAGE),
  validate(createFiscalObligationSchema),
  asyncHandler(controller.create)
);
router.patch(
  "/:obligationId",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_EDIT, SYSTEM_PERMISSIONS.COMPANIES_MANAGE),
  validate(updateFiscalObligationSchema),
  asyncHandler(controller.update)
);
router.delete(
  "/:obligationId",
  authorizeAny(SYSTEM_PERMISSIONS.COMPANIES_DELETE, SYSTEM_PERMISSIONS.COMPANIES_MANAGE),
  validate(fiscalObligationParamsSchema),
  asyncHandler(controller.remove)
);

module.exports = { fiscalObligationRouter: router };
