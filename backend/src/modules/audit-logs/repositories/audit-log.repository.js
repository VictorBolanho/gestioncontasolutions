const { AuditLog } = require("../models/audit-log.model");

class AuditLogRepository {
  async create(payload, options = {}) {
    return AuditLog.create([payload], options).then((documents) => documents[0]);
  }
}

module.exports = { AuditLogRepository };
