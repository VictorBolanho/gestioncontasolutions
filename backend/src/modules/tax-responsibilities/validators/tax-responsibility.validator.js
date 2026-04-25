const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const createTaxResponsibilitySchema = Joi.object({
  body: Joi.object({
    companyId: objectId.required(),
    name: Joi.string()
      .valid(
        "IVA",
        "RETEFUENTE",
        "RENTA",
        "ICA",
        "EXOGENA",
        "NOMINA_ELECTRONICA",
        "FACTURACION_ELECTRONICA",
        "MEDIOS_MAGNETICOS",
        "OTRA"
      )
      .required(),
    active: Joi.boolean().default(true),
    periodicity: Joi.string()
      .valid("WEEKLY", "BIWEEKLY", "MONTHLY", "BIMONTHLY", "QUARTERLY", "ANNUAL", "CUSTOM")
      .default("MONTHLY"),
    nextDate: Joi.date().iso().allow(null).default(null),
    responsible: objectId.allow(null),
    observation: Joi.string().trim().allow("").max(1000).default(""),
    status: Joi.string().valid("PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE", "INACTIVE").default("PENDING")
  }),
  params: Joi.object({}).default({}),
  query: Joi.object({}).default({})
});

const updateTaxResponsibilitySchema = Joi.object({
  body: Joi.object({
    companyId: objectId,
    name: Joi.string().valid(
      "IVA",
      "RETEFUENTE",
      "RENTA",
      "ICA",
      "EXOGENA",
      "NOMINA_ELECTRONICA",
      "FACTURACION_ELECTRONICA",
      "MEDIOS_MAGNETICOS",
      "OTRA"
    ),
    active: Joi.boolean(),
    periodicity: Joi.string().valid("WEEKLY", "BIWEEKLY", "MONTHLY", "BIMONTHLY", "QUARTERLY", "ANNUAL", "CUSTOM"),
    nextDate: Joi.date().iso().allow(null),
    responsible: objectId.allow(null),
    observation: Joi.string().trim().allow("").max(1000),
    status: Joi.string().valid("PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE", "INACTIVE")
  }).min(1),
  params: Joi.object({
    responsibilityId: objectId.required()
  }),
  query: Joi.object({}).default({})
});

const taxResponsibilityParamsSchema = Joi.object({
  body: Joi.object({}).default({}),
  params: Joi.object({
    responsibilityId: objectId.required()
  }),
  query: Joi.object({}).default({})
});

const listTaxResponsibilitiesSchema = Joi.object({
  body: Joi.object({}).default({}),
  params: Joi.object({}).default({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    companyId: objectId,
    responsible: objectId,
    name: Joi.string().valid(
      "IVA",
      "RETEFUENTE",
      "RENTA",
      "ICA",
      "EXOGENA",
      "NOMINA_ELECTRONICA",
      "FACTURACION_ELECTRONICA",
      "MEDIOS_MAGNETICOS",
      "OTRA"
    ),
    active: Joi.boolean(),
    status: Joi.string().valid("PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE", "INACTIVE")
  })
});

module.exports = {
  createTaxResponsibilitySchema,
  updateTaxResponsibilitySchema,
  taxResponsibilityParamsSchema,
  listTaxResponsibilitiesSchema
};
