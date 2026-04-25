const mongoose = require("mongoose");

const { baseOptions } = require("../../common/base.schema");

const auditLogSchema = new mongoose.Schema(
  {
    entityName: {
      type: String,
      required: true,
      trim: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "DELETE", "LOGIN", "RESET_PASSWORD"],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  baseOptions
);

auditLogSchema.index({ entityName: 1, entityId: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = { AuditLog };
