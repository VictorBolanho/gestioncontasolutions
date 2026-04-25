const Joi = require("joi");

const registerSchema = Joi.object({
  body: Joi.object({
    firstName: Joi.string().trim().min(2).max(80).required(),
    lastName: Joi.string().trim().allow("").max(80).default(""),
    email: Joi.string().email().required(),
    password: Joi.string()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
      .required()
      .messages({
        "string.pattern.base":
          "Password must contain at least 8 characters, one uppercase letter, one lowercase letter and one number."
      }),
    phone: Joi.string().trim().allow("").max(30).default(""),
    roleName: Joi.string().trim().uppercase().required()
  }),
  params: Joi.object({}).default({}),
  query: Joi.object({}).default({})
});

const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  params: Joi.object({}).default({}),
  query: Joi.object({}).default({})
});

const forgotPasswordSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required()
  }),
  params: Joi.object({}).default({}),
  query: Joi.object({}).default({})
});

const resetPasswordSchema = Joi.object({
  body: Joi.object({
    token: Joi.string().required(),
    password: Joi.string()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
      .required()
  }),
  params: Joi.object({}).default({}),
  query: Joi.object({}).default({})
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
