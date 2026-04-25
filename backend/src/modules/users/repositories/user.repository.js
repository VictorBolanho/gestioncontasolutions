const { User } = require("../models/user.model");

class UserRepository {
  async create(payload) {
    return User.create(payload);
  }

  async findByEmail(email, { includePassword = false } = {}) {
    const query = User.findOne({ email: email.toLowerCase() }).populate("role");
    if (includePassword) {
      query.select("+password +passwordResetToken +passwordResetExpiresAt");
    }
    return query;
  }

  async findById(userId) {
    return User.findById(userId).populate("role");
  }

  async findByResetToken(resetToken) {
    return User.findOne({
      passwordResetToken: resetToken,
      passwordResetExpiresAt: { $gt: new Date() }
    })
      .select("+password +passwordResetToken +passwordResetExpiresAt")
      .populate("role");
  }

  async findActiveUserById(userId) {
    return User.findOne({ _id: userId, status: "ACTIVE" }).populate("role");
  }

  async updateById(userId, payload) {
    return User.findByIdAndUpdate(userId, payload, { new: true }).populate("role");
  }

  async listActiveUsers({ search } = {}) {
    const filter = {
      status: "ACTIVE"
    };

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
    }

    return User.find(filter)
      .populate("role")
      .sort({ firstName: 1, lastName: 1 });
  }
}

module.exports = { UserRepository };
