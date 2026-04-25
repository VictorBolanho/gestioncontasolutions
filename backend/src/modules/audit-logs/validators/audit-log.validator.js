const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const listAuditLogsSchema = Joi.object({
  body: Joi.object({}).default({}),
  params: Joi.object({}).default({}),
  query: Joi.object({
    entityName: Joi.string().valid("Company", "Task", "TaxResponsibility").required(),
    entityId: objectId.required(),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
});

module.exports = { listAuditLogsSchema };
