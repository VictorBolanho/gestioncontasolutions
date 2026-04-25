const mongoose = require("mongoose");
const { StatusCodes } = require("http-status-codes");

const { AuditLogService } = require("../../audit-logs/services/audit-log.service");
const { FiscalObligationService } = require("../../fiscal-obligations/services/fiscal-obligation.service");
const { CompanyRepository } = require("../repositories/company.repository");
const { TaskRepository } = require("../../tasks/repositories/task.repository");
const { TaxResponsibilityRepository } = require("../../tax-responsibilities/repositories/tax-responsibility.repository");
const { AppError } = require("../../../utils/app-error");
const { buildPagination } = require("../../../utils/pagination");

class CompanyService {
  constructor() {
    this.companyRepository = new CompanyRepository();
    this.taxResponsibilityRepository = new TaxResponsibilityRepository();
    this.taskRepository = new TaskRepository();
    this.fiscalObligationService = new FiscalObligationService();
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
        { city: searchRegex },
        { municipality: searchRegex }
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

    if (query.municipality) {
      filter.municipality = new RegExp(query.municipality, "i");
    }

    if (query.personType) {
      filter.personType = query.personType;
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
      personType: payload.personType,
      identificationType: payload.identificationType,
      nit: payload.nit.trim(),
      verificationDigit: payload.verificationDigit,
      companyType: payload.companyType,
      taxRegime: payload.taxRegime,
      city: payload.city,
      municipality: payload.municipality,
      activeEmployees: payload.activeEmployees,
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
      nextDate: item.nextDate || this.calculateNextDueDate(item.periodicity),
      responsible: item.responsible || null,
      observation: item.observation,
      status: item.status,
      createdBy: userId,
      updatedBy: userId
    };
  }

  calculateNextDueDate(periodicity = "MONTHLY", baseDate = new Date()) {
    const dueDate = new Date(baseDate);
    const increments = {
      WEEKLY: { days: 7 },
      BIWEEKLY: { days: 15 },
      MONTHLY: { months: 1 },
      BIMONTHLY: { months: 2 },
      QUARTERLY: { months: 3 },
      ANNUAL: { years: 1 },
      CUSTOM: { months: 1 }
    };
    const increment = increments[periodicity] || increments.MONTHLY;

    if (increment.days) {
      dueDate.setDate(dueDate.getDate() + increment.days);
    }
    if (increment.months) {
      dueDate.setMonth(dueDate.getMonth() + increment.months);
    }
    if (increment.years) {
      dueDate.setFullYear(dueDate.getFullYear() + increment.years);
    }

    dueDate.setHours(17, 0, 0, 0);
    return dueDate;
  }

  mapOperationType(responsibilityName) {
    const map = {
      IVA: "IVA",
      RETEFUENTE: "RETEFUENTE",
      RENTA: "RENTA",
      NOMINA_ELECTRONICA: "NOMINA"
    };

    return map[responsibilityName] || "GERENCIAL_PERSONALIZADA";
  }

  buildInitialTaskPayloads(company, responsibilities, currentUserId) {
    return responsibilities
      .filter((item) => item.active !== false && item.nextDate)
      .map((item) => ({
        title: `Obligacion fiscal: ${item.name}`,
        description: item.observation || "Tarea generada automaticamente desde responsabilidades fiscales del cliente.",
        company: company._id,
        taxResponsibility: item._id,
        operationType: this.mapOperationType(item.name),
        assignedTo: item.responsible || company.assignedProfessional || currentUserId,
        createdBy: currentUserId,
        updatedBy: currentUserId,
        priority: item.name === "RENTA" || item.name === "IVA" ? "HIGH" : "MEDIUM",
        dueDate: item.nextDate,
        status: new Date(item.nextDate) < new Date() ? "OVERDUE" : "PENDING",
        attachments: [],
        comments: []
      }));
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

        let createdResponsibilities = [];
        let generatedTasksCount = 0;

        if (responsibilitiesPayload.length > 0) {
          createdResponsibilities = await this.taxResponsibilityRepository.insertMany(responsibilitiesPayload, { session });
          const generatedTasks = this.buildInitialTaskPayloads(company, createdResponsibilities, currentUser._id);

          if (generatedTasks.length > 0) {
            await this.taskRepository.insertMany(generatedTasks, { session });
            generatedTasksCount = generatedTasks.length;
          }
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
            initialResponsibilities: responsibilitiesPayload,
            generatedTasksCount
          },
          session
        });
      });

      await this.fiscalObligationService.generateForCompany(createdCompanyId, currentUser);

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
        before: currentCompany,
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
        before: currentCompany,
        after: deletedCompany?.toObject?.() || null,
        deletedTaxResponsibilities: relatedResponsibilities.map((item) => item.toObject())
      }
    });

    return { deleted: true };
  }
}

module.exports = { CompanyService };
