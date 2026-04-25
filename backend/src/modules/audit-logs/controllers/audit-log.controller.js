const { StatusCodes } = require("http-status-codes");

const { sendResponse } = require("../../../utils/api-response");
const { AuditLog } = require("../models/audit-log.model");

class AuditLogController {
  list = async (req, res) => {
    const { entityName, entityId, limit = 20 } = req.query;

    const logs = await AuditLog.find({
      entityName,
      entityId
    })
      .populate("performedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Audit logs fetched successfully",
      data: logs
    });
  };
}

module.exports = { AuditLogController };
