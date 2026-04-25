const mongoose = require("mongoose");

const { baseOptions, auditFields } = require("../../common/base.schema");

const companySchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: true,
      trim: true
    },
    personType: {
      type: String,
      enum: ["NATURAL", "JURIDICA"],
      default: "JURIDICA",
      index: true
    },
    identificationType: {
      type: String,
      enum: ["NIT", "CEDULA", "CEDULA_EXTRANJERIA", "PASAPORTE"],
      default: "NIT"
    },
    nit: {
      type: String,
      required: true,
      trim: true
    },
    verificationDigit: {
      type: String,
      trim: true,
      default: ""
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
    municipality: {
      type: String,
      trim: true,
      default: ""
    },
    activeEmployees: {
      type: Number,
      min: 0,
      default: 0
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

companySchema.index({ businessName: "text", nit: "text", city: "text", municipality: "text" });
companySchema.index({ isDeleted: 1, status: 1, personType: 1, assignedProfessional: 1, createdAt: -1 });

const Company = mongoose.model("Company", companySchema);

module.exports = { Company };
