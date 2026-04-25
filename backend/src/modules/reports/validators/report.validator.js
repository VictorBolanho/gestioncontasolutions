const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const tasksReportSchema = Joi.object({
  body: Joi.object({}).default({}),
  params: Joi.object({}).default({}),
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    userId: objectId,
    companyId: objectId,
    status: Joi.string().valid("PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE")
  })
});

const exportCsvSchema = Joi.object({
  body: Joi.object({}).default({}),
  params: Joi.object({}).default({}),
  query: Joi.object({
    type: Joi.string().valid("tasks", "companies").default("tasks"),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    userId: objectId,
    companyId: objectId,
    status: Joi.string().valid("PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE")
  })
});

module.exports = {
  tasksReportSchema,
  exportCsvSchema
};
