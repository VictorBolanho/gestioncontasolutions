const mongoose = require("mongoose");

const { baseOptions, auditFields } = require("../../common/base.schema");

const attachmentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true, versionKey: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    operationType: {
      type: String,
      enum: [
        "RENTA",
        "IVA",
        "RETEFUENTE",
        "NOMINA",
        "CONSTITUCION_EMPRESA",
        "AFILIACIONES",
        "ESTADOS_FINANCIEROS",
        "GERENCIAL_PERSONALIZADA",
        "OTRA"
      ],
      default: "OTRA",
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM"
    },
    dueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"],
      default: "PENDING"
    },
    attachments: {
      type: [attachmentSchema],
      default: []
    },
    comments: {
      type: [commentSchema],
      default: []
    },
    taxResponsibility: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaxResponsibility",
      default: null
    },
    ...auditFields
  },
  baseOptions
);

taskSchema.index({ assignedTo: 1, dueDate: 1, status: 1 });
taskSchema.index({ company: 1, operationType: 1, dueDate: 1 });
taskSchema.index({ status: 1, dueDate: 1, priority: 1 });
taskSchema.index({ createdBy: 1, createdAt: -1 });

const Task = mongoose.model("Task", taskSchema);

module.exports = { Task };
