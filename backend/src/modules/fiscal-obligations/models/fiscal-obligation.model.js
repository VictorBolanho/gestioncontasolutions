const mongoose = require("mongoose");

const { auditFields, baseOptions } = require("../../common/base.schema");

const fiscalObligationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true
    },
    responsibilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaxResponsibility",
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        "RENTA",
        "IVA",
        "RETEFUENTE",
        "ICA",
        "EXOGENA",
        "NOMINA_ELECTRONICA",
        "FACTURACION_ELECTRONICA",
        "MEDIOS_MAGNETICOS",
        "OTRA"
      ],
      index: true
    },
    period: {
      type: String,
      required: true,
      trim: true
    },
    fiscalYear: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
      index: true
    },
    dueDate: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "submitted", "overdue"],
      default: "pending",
      index: true
    },
    assignedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null
    },
    submittedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    ...auditFields
  },
  baseOptions
);

fiscalObligationSchema.index(
  { companyId: 1, responsibilityId: 1, type: 1, period: 1, fiscalYear: 1 },
  { unique: true }
);
fiscalObligationSchema.index({ status: 1, dueDate: 1, assignedUserId: 1 });

const FiscalObligation = mongoose.model("FiscalObligation", fiscalObligationSchema);

module.exports = { FiscalObligation };
