const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const calendarEventsSchema = Joi.object({
  body: Joi.object({}).default({}),
  params: Joi.object({}).default({}),
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    companyId: objectId,
    assignedTo: objectId,
    responsible: objectId
  })
});

module.exports = { calendarEventsSchema };
