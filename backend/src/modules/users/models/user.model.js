const mongoose = require("mongoose");

const { baseOptions, auditFields } = require("../../common/base.schema");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      trim: true,
      default: ""
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "BLOCKED"],
      default: "ACTIVE"
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    passwordResetToken: {
      type: String,
      select: false,
      default: null
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false,
      default: null
    },
    ...auditFields
  },
  baseOptions
);

userSchema.virtual("fullName").get(function fullName() {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.set("toJSON", {
  virtuals: true,
  transform: (_, returnedObject) => {
    delete returnedObject.password;
    delete returnedObject.passwordResetToken;
    delete returnedObject.passwordResetExpiresAt;
    return returnedObject;
  }
});

const User = mongoose.model("User", userSchema);

module.exports = { User };
