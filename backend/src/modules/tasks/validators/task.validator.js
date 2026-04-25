const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const attachmentSchema = Joi.object({
  fileName: Joi.string().trim().max(255).required(),
  fileUrl: Joi.string().uri().required()
});

const commentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required()
});

const operationType = Joi.string().valid(
  "RENTA",
  "IVA",
  "RETEFUENTE",
  "NOMINA",
  "CONSTITUCION_EMPRESA",
  "AFILIACIONES",
  "ESTADOS_FINANCIEROS",
  "GERENCIAL_PERSONALIZADA",
  "OTRA"
);

const createTaskSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().min(2).max(200).required(),
    description: Joi.string().trim().allow("").max(5000).default(""),
    companyId: objectId.required(),
    responsibilityId: objectId.allow(null).default(null),
    operationType: operationType.default("OTRA"),
    assignedTo: objectId.required(),
    priority: Joi.string().valid("LOW", "MEDIUM", "HIGH", "CRITICAL").default("MEDIUM"),
    dueDate: Joi.date().iso().required(),
    status: Joi.string().valid("PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE").default("PENDING"),
    attachments: Joi.array().items(attachmentSchema).default([]),
    comments: Joi.array().items(commentSchema).default([])
  }),
  params: Joi.object({}).default({}),
  query: Joi.object({}).default({})
});

const updateTaskSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().min(2).max(200),
    description: Joi.string().trim().allow("").max(5000),
    companyId: objectId,
    responsibilityId: objectId.allow(null),
    operationType,
    assignedTo: objectId,
    priority: Joi.string().valid("LOW", "MEDIUM", "HIGH", "CRITICAL"),
    dueDate: Joi.date().iso(),
    status: Joi.string().valid("PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"),
    attachments: Joi.array().items(attachmentSchema),
    comment: Joi.string().trim().min(1).max(2000)
  }).min(1),
  params: Joi.object({
    taskId: objectId.required()
  }),
  query: Joi.object({}).default({})
});

const taskParamsSchema = Joi.object({
  body: Joi.object({}).default({}),
  params: Joi.object({
    taskId: objectId.required()
  }),
  query: Joi.object({}).default({})
});

const listTasksSchema = Joi.object({
  body: Joi.object({}).default({}),
  params: Joi.object({}).default({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    companyId: objectId,
    assignedTo: objectId,
    operationType,
    priority: Joi.string().valid("LOW", "MEDIUM", "HIGH", "CRITICAL"),
    overdue: Joi.boolean(),
    status: Joi.string().valid("PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"),
    dateFrom: Joi.date().iso(),
    dateTo: Joi.date().iso()
  })
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  taskParamsSchema,
  listTasksSchema
};
