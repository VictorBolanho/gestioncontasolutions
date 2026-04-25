const { StatusCodes } = require("http-status-codes");

const { sendResponse } = require("../../../utils/api-response");
const { FiscalObligationService } = require("../services/fiscal-obligation.service");

class FiscalObligationController {
  constructor() {
    this.fiscalObligationService = new FiscalObligationService();
  }

  create = async (req, res) => {
    const result = await this.fiscalObligationService.create(req.body, req.user);
    return sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      message: "Fiscal obligation created successfully",
      data: result
    });
  };

  list = async (req, res) => {
    const result = await this.fiscalObligationService.list(req.query);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Fiscal obligations fetched successfully",
      data: result.items,
      meta: result.meta
    });
  };

  getById = async (req, res) => {
    const result = await this.fiscalObligationService.getById(req.params.obligationId);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Fiscal obligation fetched successfully",
      data: result
    });
  };

  update = async (req, res) => {
    const result = await this.fiscalObligationService.update(req.params.obligationId, req.body, req.user);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Fiscal obligation updated successfully",
      data: result
    });
  };

  remove = async (req, res) => {
    const result = await this.fiscalObligationService.remove(req.params.obligationId, req.user);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Fiscal obligation deleted successfully",
      data: result
    });
  };

  generateForCompany = async (req, res) => {
    const result = await this.fiscalObligationService.generateForCompany(req.params.companyId, req.user);
    return sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      message: "Fiscal obligations generated successfully",
      data: result
    });
  };

  upcoming = async (req, res) => {
    const result = await this.fiscalObligationService.getUpcoming(req.query.days, req.query.limit);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Upcoming fiscal obligations fetched successfully",
      data: result
    });
  };

  clientsAtRisk = async (req, res) => {
    const result = await this.fiscalObligationService.getClientsAtRisk();
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Clients at risk fetched successfully",
      data: result
    });
  };
}

module.exports = { FiscalObligationController };
