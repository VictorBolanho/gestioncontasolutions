const mongoose = require("mongoose");

const { baseOptions, auditFields } = require("../../common/base.schema");

const taxResponsibilitySchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      enum: [
        "IVA",
        "RETEFUENTE",
        "RENTA",
        "ICA",
        "EXOGENA",
        "NOMINA_ELECTRONICA",
        "FACTURACION_ELECTRONICA",
        "MEDIOS_MAGNETICOS",
        "OTRA"
      ]
    },
    active: {
      type: Boolean,
      default: true
    },
    periodicity: {
      type: String,
      enum: ["WEEKLY", "BIWEEKLY", "MONTHLY", "BIMONTHLY", "QUARTERLY", "ANNUAL", "CUSTOM"],
      default: "MONTHLY"
    },
    nextDate: {
      type: Date,
      default: null
    },
    responsible: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    observation: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE", "INACTIVE"],
      default: "PENDING"
    },
    ...auditFields
  },
  baseOptions
);

taxResponsibilitySchema.index({ company: 1, name: 1 }, { unique: true });
taxResponsibilitySchema.index({ active: 1, status: 1, nextDate: 1, responsible: 1 });

const TaxResponsibility = mongoose.model("TaxResponsibility", taxResponsibilitySchema);

module.exports = { TaxResponsibility };
