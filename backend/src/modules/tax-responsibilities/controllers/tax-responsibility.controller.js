const { StatusCodes } = require("http-status-codes");

const { TaxResponsibilityService } = require("../services/tax-responsibility.service");
const { sendResponse } = require("../../../utils/api-response");

class TaxResponsibilityController {
  constructor() {
    this.taxResponsibilityService = new TaxResponsibilityService();
  }

  create = async (req, res) => {
    const result = await this.taxResponsibilityService.create(req.body, req.user);
    return sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      message: "Tax responsibility created successfully",
      data: result
    });
  };

  list = async (req, res) => {
    const result = await this.taxResponsibilityService.list(req.query);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Tax responsibilities fetched successfully",
      data: result.items,
      meta: result.meta
    });
  };

  getById = async (req, res) => {
    const result = await this.taxResponsibilityService.getById(req.params.responsibilityId);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Tax responsibility fetched successfully",
      data: result
    });
  };

  update = async (req, res) => {
    const result = await this.taxResponsibilityService.update(req.params.responsibilityId, req.body, req.user);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Tax responsibility updated successfully",
      data: result
    });
  };

  remove = async (req, res) => {
    const result = await this.taxResponsibilityService.remove(req.params.responsibilityId, req.user);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Tax responsibility deleted successfully",
      data: result
    });
  };
}

module.exports = { TaxResponsibilityController };
