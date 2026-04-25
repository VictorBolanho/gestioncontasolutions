const Joi = require("joi");

const listUsersSchema = Joi.object({
  body: Joi.object({}).default({}),
  params: Joi.object({}).default({}),
  query: Joi.object({
    search: Joi.string().trim().allow("")
  }).default({})
});

module.exports = { listUsersSchema };
