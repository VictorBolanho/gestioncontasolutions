const { StatusCodes } = require("http-status-codes");

const { CompanyService } = require("../services/company.service");
const { sendResponse } = require("../../../utils/api-response");

class CompanyController {
  constructor() {
    this.companyService = new CompanyService();
  }

  create = async (req, res) => {
    const company = await this.companyService.create(req.body, req.user);
    return sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      message: "Company created successfully",
      data: company
    });
  };

  createWithResponsibilities = async (req, res) => {
    const company = await this.companyService.createWithResponsibilities(req.body, req.user);
    return sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      message: "Company and initial responsibilities created successfully",
      data: company
    });
  };

  list = async (req, res) => {
    const result = await this.companyService.list(req.query);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Companies fetched successfully",
      data: result.items,
      meta: result.meta
    });
  };

  getById = async (req, res) => {
    const company = await this.companyService.getById(req.params.companyId);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Company fetched successfully",
      data: company
    });
  };

  update = async (req, res) => {
    const company = await this.companyService.update(req.params.companyId, req.body, req.user);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Company updated successfully",
      data: company
    });
  };

  remove = async (req, res) => {
    const result = await this.companyService.remove(req.params.companyId, req.user);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Company deleted successfully",
      data: result
    });
  };
}

module.exports = { CompanyController };
