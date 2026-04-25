const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const responsibilitySchema = Joi.object({
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
});

const companyBodySchema = {
  businessName: Joi.string().trim().min(2).max(200).required(),
  personType: Joi.string().valid("NATURAL", "JURIDICA").default("JURIDICA"),
  identificationType: Joi.string().valid("NIT", "CEDULA", "CEDULA_EXTRANJERIA", "PASAPORTE").default("NIT"),
  nit: Joi.string().trim().min(5).max(30).required(),
  verificationDigit: Joi.string().trim().allow("").max(2).default(""),
  companyType: Joi.string().trim().allow("").max(100).default(""),
  taxRegime: Joi.string().trim().allow("").max(100).default(""),
  city: Joi.string().trim().allow("").max(100).default(""),
  municipality: Joi.string().trim().allow("").max(100).default(""),
  activeEmployees: Joi.number().integer().min(0).default(0),
  economicActivity: Joi.string().trim().allow("").max(150).default(""),
  status: Joi.string().valid("ACTIVE", "INACTIVE", "SUSPENDED").default("ACTIVE"),
  assignedProfessional: objectId.allow(null),
  observations: Joi.string().trim().allow("").max(2000).default("")
};

const createCompanySchema = Joi.object({
  body: Joi.object(companyBodySchema),
  params: Joi.object({}).default({}),
  query: Joi.object({}).default({})
});

const createCompanyWithResponsibilitiesSchema = Joi.object({
  body: Joi.object({
    ...companyBodySchema,
    initialResponsibilities: Joi.array().items(responsibilitySchema).default([])
  }),
  params: Joi.object({}).default({}),
  query: Joi.object({}).default({})
});

const updateCompanySchema = Joi.object({
  body: Joi.object({
    businessName: Joi.string().trim().min(2).max(200),
    personType: Joi.string().valid("NATURAL", "JURIDICA"),
    identificationType: Joi.string().valid("NIT", "CEDULA", "CEDULA_EXTRANJERIA", "PASAPORTE"),
    nit: Joi.string().trim().min(5).max(30),
    verificationDigit: Joi.string().trim().allow("").max(2),
    companyType: Joi.string().trim().allow("").max(100),
    taxRegime: Joi.string().trim().allow("").max(100),
    city: Joi.string().trim().allow("").max(100),
    municipality: Joi.string().trim().allow("").max(100),
    activeEmployees: Joi.number().integer().min(0),
    economicActivity: Joi.string().trim().allow("").max(150),
    status: Joi.string().valid("ACTIVE", "INACTIVE", "SUSPENDED"),
    assignedProfessional: objectId.allow(null),
    observations: Joi.string().trim().allow("").max(2000)
  }).min(1),
  params: Joi.object({
    companyId: objectId.required()
  }),
  query: Joi.object({}).default({})
});

const companyParamsSchema = Joi.object({
  body: Joi.object({}).default({}),
  params: Joi.object({
    companyId: objectId.required()
  }),
  query: Joi.object({}).default({})
});

const listCompaniesSchema = Joi.object({
  body: Joi.object({}).default({}),
  params: Joi.object({}).default({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().allow(""),
    name: Joi.string().trim().allow(""),
    businessName: Joi.string().trim().allow(""),
    nit: Joi.string().trim().allow(""),
    city: Joi.string().trim().allow(""),
    municipality: Joi.string().trim().allow(""),
    personType: Joi.string().valid("NATURAL", "JURIDICA"),
    responsible: objectId,
    assignedProfessional: objectId,
    status: Joi.string().valid("ACTIVE", "INACTIVE", "SUSPENDED")
  })
});

module.exports = {
  createCompanySchema,
  createCompanyWithResponsibilitiesSchema,
  updateCompanySchema,
  companyParamsSchema,
  listCompaniesSchema
};
