const mongoose = require("mongoose");

const { baseOptions, auditFields } = require("../../common/base.schema");

const companySchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: true,
      trim: true
    },
    nit: {
      type: String,
      required: true,
      trim: true
    },
    companyType: {
      type: String,
      trim: true,
      default: ""
    },
    taxRegime: {
      type: String,
      trim: true,
      default: ""
    },
    city: {
      type: String,
      trim: true,
      default: ""
    },
    economicActivity: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE"
    },
    assignedProfessional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    observations: {
      type: String,
      trim: true,
      default: ""
    },
    responsibilitiesSnapshot: {
      type: [String],
      default: []
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    ...auditFields
  },
  baseOptions
);

companySchema.index(
  { nit: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false }
  }
);

companySchema.index({ businessName: "text", nit: "text", city: "text" });
companySchema.index({ isDeleted: 1, status: 1, assignedProfessional: 1, createdAt: -1 });

const Company = mongoose.model("Company", companySchema);

module.exports = { Company };
