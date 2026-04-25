const mongoose = require("mongoose");

const { baseOptions } = require("../../common/base.schema");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["INFO", "WARNING", "CRITICAL", "SUCCESS"],
      default: "INFO"
    },
    isRead: {
      type: Boolean,
      default: false
    },
    referenceType: {
      type: String,
      enum: ["TASK", "COMPANY", "TAX_RESPONSIBILITY", "SYSTEM", "CALENDAR_EVENT"],
      default: "SYSTEM"
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    triggerCode: {
      type: String,
      trim: true,
      default: ""
    },
    triggeredAt: {
      type: Date,
      default: Date.now
    }
  },
  baseOptions
);

notificationSchema.index(
  { user: 1, referenceType: 1, referenceId: 1, triggerCode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      referenceId: { $type: "objectId" },
      triggerCode: { $exists: true, $ne: "" }
    }
  }
);
notificationSchema.index({ type: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = { Notification };
