const { Role } = require("../models/role.model");

class RoleRepository {
  async findByName(name) {
    return Role.findOne({ name: name.toUpperCase() });
  }

  async upsertSystemRole(payload) {
    return Role.findOneAndUpdate(
      { name: payload.name.toUpperCase() },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  async findAll() {
    return Role.find().sort({ createdAt: 1 });
  }
}

module.exports = { RoleRepository };
