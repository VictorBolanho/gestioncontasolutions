const { StatusCodes } = require("http-status-codes");

const { AuditLogService } = require("../../audit-logs/services/audit-log.service");
const { CompanyRepository } = require("../../companies/repositories/company.repository");
const { TaxResponsibilityRepository } = require("../repositories/tax-responsibility.repository");
const { AppError } = require("../../../utils/app-error");
const { buildPagination } = require("../../../utils/pagination");

class TaxResponsibilityService {
  constructor() {
    this.taxResponsibilityRepository = new TaxResponsibilityRepository();
    this.companyRepository = new CompanyRepository();
    this.auditLogService = new AuditLogService();
  }

  async syncCompanySnapshot(companyId, updatedBy) {
    const items = await this.taxResponsibilityRepository.findByCompany(companyId);
    await this.companyRepository.updateById(companyId, {
      responsibilitiesSnapshot: items.map((item) => item.name),
      updatedBy
    });
  }

  async ensureCompanyExists(companyId) {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new AppError("Company not found", StatusCodes.NOT_FOUND);
    }

    return company;
  }

  buildFilter(query) {
    const filter = {};

    if (query.companyId) {
      filter.company = query.companyId;
    }

    if (query.name) {
      filter.name = query.name;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.active !== undefined) {
      filter.active = query.active;
    }

    if (query.responsible) {
      filter.responsible = query.responsible;
    }

    return filter;
  }

  async create(payload, currentUser) {
    await this.ensureCompanyExists(payload.companyId);

    const existingItem = await this.taxResponsibilityRepository.findByCompanyAndName(payload.companyId, payload.name);
    if (existingItem) {
      throw new AppError("This responsibility already exists for the company", StatusCodes.CONFLICT);
    }

    const responsibility = await this.taxResponsibilityRepository.create({
      company: payload.companyId,
      name: payload.name,
      active: payload.active,
      periodicity: payload.periodicity,
      nextDate: payload.nextDate,
      responsible: payload.responsible || null,
      observation: payload.observation,
      status: payload.status,
      createdBy: currentUser._id,
      updatedBy: currentUser._id
    });

    await this.auditLogService.record({
      entityName: "TaxResponsibility",
      entityId: responsibility._id,
      action: "CREATE",
      performedBy: currentUser._id,
      changes: responsibility.toObject()
    });

    await this.syncCompanySnapshot(payload.companyId, currentUser._id);

    return this.taxResponsibilityRepository.findById(responsibility._id);
  }

  async list(query) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const filter = this.buildFilter(query);
    const sort = { nextDate: 1, createdAt: -1 };

    const { items, total } = await this.taxResponsibilityRepository.paginate({
      filter,
      page,
      limit,
      sort
    });

    return {
      items,
      meta: buildPagination({ page, limit, total })
    };
  }

  async getById(responsibilityId) {
    const responsibility = await this.taxResponsibilityRepository.findById(responsibilityId);
    if (!responsibility) {
      throw new AppError("Tax responsibility not found", StatusCodes.NOT_FOUND);
    }

    return responsibility;
  }

  async update(responsibilityId, payload, currentUser) {
    const currentItem = await this.getById(responsibilityId);

    if (payload.companyId) {
      await this.ensureCompanyExists(payload.companyId);
    }

    const targetCompanyId = payload.companyId || currentItem.company._id.toString();
    const targetName = payload.name || currentItem.name;
    const duplicate = await this.taxResponsibilityRepository.findByCompanyAndName(targetCompanyId, targetName);

    if (duplicate && duplicate._id.toString() !== responsibilityId) {
      throw new AppError("This responsibility already exists for the company", StatusCodes.CONFLICT);
    }

    const updatedItem = await this.taxResponsibilityRepository.updateById(responsibilityId, {
      company: targetCompanyId,
      name: targetName,
      active: payload.active ?? currentItem.active,
      periodicity: payload.periodicity || currentItem.periodicity,
      nextDate: payload.nextDate ?? currentItem.nextDate,
      responsible: payload.responsible !== undefined ? payload.responsible : currentItem.responsible?._id || null,
      observation: payload.observation ?? currentItem.observation,
      status: payload.status || currentItem.status,
      updatedBy: currentUser._id
    });

    await this.auditLogService.record({
      entityName: "TaxResponsibility",
      entityId: updatedItem._id,
      action: "UPDATE",
      performedBy: currentUser._id,
      changes: {
        before: currentItem.toObject(),
        after: updatedItem.toObject()
      }
    });

    await this.syncCompanySnapshot(targetCompanyId, currentUser._id);
    if (targetCompanyId !== currentItem.company._id.toString()) {
      await this.syncCompanySnapshot(currentItem.company._id.toString(), currentUser._id);
    }

    return updatedItem;
  }

  async remove(responsibilityId, currentUser) {
    const currentItem = await this.getById(responsibilityId);
    await this.taxResponsibilityRepository.deleteById(responsibilityId);

    await this.auditLogService.record({
      entityName: "TaxResponsibility",
      entityId: responsibilityId,
      action: "DELETE",
      performedBy: currentUser._id,
      changes: {
        before: currentItem.toObject()
      }
    });

    await this.syncCompanySnapshot(currentItem.company._id.toString(), currentUser._id);

    return { deleted: true };
  }
}

module.exports = { TaxResponsibilityService };
