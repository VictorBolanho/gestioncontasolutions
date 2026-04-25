const Joi = require("joi");

const objectId = Joi.string().hex().length(24);
const obligationStatus = Joi.string().valid("pending", "in_progress", "submitted", "overdue");
const obligationType = Joi.string().valid(
  "RENTA",
  "IVA",
  "RETEFUENTE",
  "ICA",
  "EXOGENA",
  "NOMINA_ELECTRONICA",
  "FACTURACION_ELECTRONICA",
  "MEDIOS_MAGNETICOS",
  "OTRA"
);

const createFiscalObligationSchema = Joi.object({
  body: Joi.object({
    companyId: objectId.required(),
    responsibilityId: objectId.required(),
    type: obligationType.required(),
    period: Joi.string().trim().min(1).max(30).required(),
    fiscalYear: Joi.number().integer().min(2000).max(2100).required(),
    dueDate: Joi.date().iso().required(),
    status: obligationStatus.default("pending"),
    assignedUserId: objectId.allow(null).default(null),
    taskId: objectId.allow(null).default(null),
    submittedAt: Joi.date().iso().allow(null).default(null),
    notes: Joi.string().trim().allow("").max(2000).default("")
  }),
  params: Joi.object({}).default({}),
  query: Joi.object({}).default({})
});

const updateFiscalObligationSchema = Joi.object({
  body: Joi.object({
    companyId: objectId,
    responsibilityId: objectId,
    type: obligationType,
    period: Joi.string().trim().min(1).max(30),
    fiscalYear: Joi.number().integer().min(2000).max(2100),
    dueDate: Joi.date().iso(),
    status: obligationStatus,
    assignedUserId: objectId.allow(null),
    taskId: objectId.allow(null),
    submittedAt: Joi.date().iso().allow(null),
    notes: Joi.string().trim().allow("").max(2000)
  }).min(1),
  params: Joi.object({
    obligationId: objectId.required()
  }),
  query: Joi.object({}).default({})
});

const fiscalObligationParamsSchema = Joi.object({
  body: Joi.object({}).default({}),
  params: Joi.object({
    obligationId: objectId.required()
  }),
  query: Joi.object({}).default({})
});

const generateFiscalObligationsSchema = Joi.object({
  body: Joi.object({}).default({}),
  params: Joi.object({
    companyId: objectId.required()
  }),
  query: Joi.object({}).default({})
});

const listFiscalObligationsSchema = Joi.object({
  body: Joi.object({}).default({}),
  params: Joi.object({}).default({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    companyId: objectId,
    responsibilityId: objectId,
    assignedUserId: objectId,
    type: obligationType,
    period: Joi.string().trim().allow(""),
    fiscalYear: Joi.number().integer().min(2000).max(2100),
    status: obligationStatus,
    dateFrom: Joi.date().iso(),
    dateTo: Joi.date().iso()
  })
});

const upcomingFiscalObligationsSchema = Joi.object({
  body: Joi.object({}).default({}),
  params: Joi.object({}).default({}),
  query: Joi.object({
    days: Joi.number().integer().min(1).max(365).default(30),
    limit: Joi.number().integer().min(1).max(100).default(50)
  })
});

module.exports = {
  createFiscalObligationSchema,
  updateFiscalObligationSchema,
  fiscalObligationParamsSchema,
  generateFiscalObligationsSchema,
  listFiscalObligationsSchema,
  upcomingFiscalObligationsSchema
};
