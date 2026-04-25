const { StatusCodes } = require("http-status-codes");

const { sendResponse } = require("../../../utils/api-response");
const { ReportService } = require("../services/report.service");

class ReportController {
  constructor() {
    this.reportService = new ReportService();
  }

  tasks = async (req, res) => {
    const data = await this.reportService.getTasksReport(req.query);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Tasks report fetched successfully",
      data
    });
  };

  companies = async (req, res) => {
    const data = await this.reportService.getCompaniesRiskReport();
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Companies risk report fetched successfully",
      data
    });
  };

  exportCsv = async (req, res) => {
    const result = await this.reportService.exportCsv(req.query);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);

    return res.status(StatusCodes.OK).send(result.content);
  };
}

module.exports = { ReportController };
