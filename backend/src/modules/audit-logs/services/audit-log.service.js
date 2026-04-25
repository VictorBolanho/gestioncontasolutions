const { AuditLogRepository } = require("../repositories/audit-log.repository");

class AuditLogService {
  constructor() {
    this.auditLogRepository = new AuditLogRepository();
  }

  async record({
    entityName,
    entityId,
    action,
    performedBy = null,
    changes = null,
    metadata = null,
    session = null
  }) {
    return this.auditLogRepository.create(
      {
        entityName,
        entityId,
        action,
        performedBy,
        changes,
        metadata
      },
      session ? { session } : {}
    );
  }
}

module.exports = { AuditLogService };
