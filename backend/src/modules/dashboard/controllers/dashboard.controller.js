const { StatusCodes } = require("http-status-codes");

const { sendResponse } = require("../../../utils/api-response");
const { DashboardService } = require("../services/dashboard.service");

class DashboardController {
  constructor() {
    this.dashboardService = new DashboardService();
  }

  overview = async (req, res) => {
    const data = await this.dashboardService.getOverview();
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Dashboard overview fetched successfully",
      data
    });
  };

  workload = async (req, res) => {
    const data = await this.dashboardService.getWorkload();
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Dashboard workload fetched successfully",
      data
    });
  };

  compliance = async (req, res) => {
    const data = await this.dashboardService.getCompliance();
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Dashboard compliance fetched successfully",
      data
    });
  };

  upcomingObligations = async (req, res) => {
    const data = await this.dashboardService.getUpcomingObligations();
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Dashboard upcoming fiscal obligations fetched successfully",
      data
    });
  };

  clientsAtRisk = async (req, res) => {
    const data = await this.dashboardService.getClientsAtRisk();
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Dashboard clients at risk fetched successfully",
      data
    });
  };
}

module.exports = { DashboardController };
