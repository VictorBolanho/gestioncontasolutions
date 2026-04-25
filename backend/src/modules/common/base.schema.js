const mongoose = require("mongoose");

const baseOptions = {
  timestamps: true,
  versionKey: false
};

const auditFields = {
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }
};

module.exports = {
  baseOptions,
  auditFields
};
