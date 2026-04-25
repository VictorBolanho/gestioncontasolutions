const mongoose = require("mongoose");
const { StatusCodes } = require("http-status-codes");

const { AuditLogService } = require("../../audit-logs/services/audit-log.service");
const { CompanyRepository } = require("../repositories/company.repository");
const { TaxResponsibilityRepository } = require("../../tax-responsibilities/repositories/tax-responsibility.repository");
const { AppError } = require("../../../utils/app-error");
const { buildPagination } = require("../../../utils/pagination");

class CompanyService {
  constructor() {
    this.companyRepository = new CompanyRepository();
    this.taxResponsibilityRepository = new TaxResponsibilityRepository();
    this.auditLogService = new AuditLogService();
  }

  buildCompanyFilter(query) {
    const filter = { isDeleted: false };
    const businessName = query.businessName || query.name;
    const assignedProfessional = query.assignedProfessional || query.responsible;

    if (query.search) {
      const searchRegex = new RegExp(query.search, "i");
      filter.$or = [
        { businessName: searchRegex },
        { nit: searchRegex },
        { city: searchRegex }
      ];
    }

    if (businessName) {
      filter.businessName = new RegExp(businessName, "i");
    }

    if (query.nit) {
      filter.nit = new RegExp(query.nit, "i");
    }

    if (query.city) {
      filter.city = new RegExp(query.city, "i");
    }

    if (assignedProfessional) {
      filter.assignedProfessional = assignedProfessional;
    }

    if (query.status) {
      filter.status = query.status;
    }

    return filter;
  }

  mapCompanyPayload(payload, userId) {
    return {
      businessName: payload.businessName,
      nit: payload.nit.trim(),
      companyType: payload.companyType,
      taxRegime: payload.taxRegime,
      city: payload.city,
      economicActivity: payload.economicActivity,
      status: payload.status,
      assignedProfessional: payload.assignedProfessional || null,
      observations: payload.observations,
      updatedBy: userId,
      createdBy: userId
    };
  }

  mapResponsibilityPayload(item, companyId, userId) {
    return {
      company: companyId,
      name: item.name,
      active: item.active,
      periodicity: item.periodicity,
      nextDate: item.nextDate,
      responsible: item.responsible || null,
      observation: item.observation,
      status: item.status,
      createdBy: userId,
      updatedBy: userId
    };
  }

  async create(payload, currentUser) {
    const existingCompany = await this.companyRepository.findByNit(payload.nit);
    if (existingCompany) {
      throw new AppError("A company with this NIT already exists", StatusCodes.CONFLICT);
    }

    const company = await this.companyRepository.create(this.mapCompanyPayload(payload, currentUser._id));

    await this.auditLogService.record({
      entityName: "Company",
      entityId: company._id,
      action: "CREATE",
      performedBy: currentUser._id,
      changes: company.toObject()
    });

    return this.getById(company._id);
  }

  async createWithResponsibilities(payload, currentUser) {
    const existingCompany = await this.companyRepository.findByNit(payload.nit);
    if (existingCompany) {
      throw new AppError("A company with this NIT already exists", StatusCodes.CONFLICT);
    }

    const session = await mongoose.startSession();

    try {
      let createdCompanyId = null;

      await session.withTransaction(async () => {
        const companyPayload = this.mapCompanyPayload(payload, currentUser._id);
        const company = await this.companyRepository.create(companyPayload, { session });
        createdCompanyId = company._id;

        const responsibilitiesPayload = (payload.initialResponsibilities || []).map((item) =>
          this.mapResponsibilityPayload(item, company._id, currentUser._id)
        );

        if (responsibilitiesPayload.length > 0) {
          await this.taxResponsibilityRepository.insertMany(responsibilitiesPayload, { session });
        }

        await this.companyRepository.updateById(
          company._id,
          {
            responsibilitiesSnapshot: responsibilitiesPayload.map((item) => item.name),
            updatedBy: currentUser._id
          },
          { session }
        );

        await this.auditLogService.record({
          entityName: "Company",
          entityId: company._id,
          action: "CREATE",
          performedBy: currentUser._id,
          changes: {
            company: companyPayload,
            initialResponsibilities: responsibilitiesPayload
          },
          session
        });
      });

      return this.getById(createdCompanyId);
    } finally {
      await session.endSession();
    }
  }

  async getById(companyId) {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new AppError("Company not found", StatusCodes.NOT_FOUND);
    }

    const responsibilities = await this.taxResponsibilityRepository.findByCompany(companyId);

    return {
      ...company.toObject(),
      taxResponsibilities: responsibilities
    };
  }

  async list(query) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const filter = this.buildCompanyFilter(query);
    const sort = { createdAt: -1 };

    const { items, total } = await this.companyRepository.paginate({
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

  async update(companyId, payload, currentUser) {
    const currentCompany = await this.getById(companyId);

    if (payload.nit && payload.nit.trim() !== currentCompany.nit) {
      const existingCompany = await this.companyRepository.findByNit(payload.nit);
      if (existingCompany && existingCompany._id.toString() !== companyId) {
        throw new AppError("A company with this NIT already exists", StatusCodes.CONFLICT);
      }
    }

    const updatePayload = {
      ...payload,
      nit: payload.nit ? payload.nit.trim() : currentCompany.nit,
      updatedBy: currentUser._id
    };

    const updatedCompany = await this.companyRepository.updateById(companyId, updatePayload);
    if (!updatedCompany) {
      throw new AppError("Company not found", StatusCodes.NOT_FOUND);
    }

    await this.auditLogService.record({
      entityName: "Company",
      entityId: updatedCompany._id,
      action: "UPDATE",
      performedBy: currentUser._id,
      changes: {
        before: currentCompany.toObject(),
        after: updatedCompany.toObject()
      }
    });

    return this.getById(updatedCompany._id);
  }

  async remove(companyId, currentUser) {
    const currentCompany = await this.getById(companyId);
    const relatedResponsibilities = await this.taxResponsibilityRepository.findByCompany(companyId);

    const deletedCompany = await this.companyRepository.updateById(companyId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: currentUser._id,
      updatedBy: currentUser._id
    });

    if (relatedResponsibilities.length > 0) {
      await this.taxResponsibilityRepository.deleteManyByCompany(companyId);
    }

    await this.auditLogService.record({
      entityName: "Company",
      entityId: companyId,
      action: "DELETE",
      performedBy: currentUser._id,
      changes: {
        before: currentCompany.toObject(),
        after: deletedCompany?.toObject?.() || null,
        deletedTaxResponsibilities: relatedResponsibilities.map((item) => item.toObject())
      }
    });

    return { deleted: true };
  }
}

module.exports = { CompanyService };
