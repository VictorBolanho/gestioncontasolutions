const mongoose = require("mongoose");

const { baseOptions } = require("../../common/base.schema");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    label: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    permissions: {
      type: [String],
      default: []
    },
    isSystem: {
      type: Boolean,
      default: true
    }
  },
  baseOptions
);

const Role = mongoose.model("Role", roleSchema);

module.exports = { Role };
