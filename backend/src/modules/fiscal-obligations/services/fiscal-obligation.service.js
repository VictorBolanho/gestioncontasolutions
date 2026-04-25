const { StatusCodes } = require("http-status-codes");

const { AuditLogService } = require("../../audit-logs/services/audit-log.service");
const { CompanyRepository } = require("../../companies/repositories/company.repository");
const { TaxResponsibilityRepository } = require("../../tax-responsibilities/repositories/tax-responsibility.repository");
const { AppError } = require("../../../utils/app-error");
const { buildPagination } = require("../../../utils/pagination");
const { FiscalObligationRepository } = require("../repositories/fiscal-obligation.repository");

class FiscalObligationService {
  constructor() {
    this.fiscalObligationRepository = new FiscalObligationRepository();
    this.companyRepository = new CompanyRepository();
    this.taxResponsibilityRepository = new TaxResponsibilityRepository();
    this.auditLogService = new AuditLogService();
  }

  async syncOverdue() {
    await this.fiscalObligationRepository.updateMany(
      {
        dueDate: { $lt: new Date() },
        status: { $in: ["pending", "in_progress"] }
      },
      { status: "overdue" }
    );
  }

  normalizeStatus(status, dueDate) {
    if (status === "submitted") {
      return "submitted";
    }

    if (new Date(dueDate) < new Date()) {
      return "overdue";
    }

    return status || "pending";
  }

  buildPeriod(dueDate, periodicity = "MONTHLY") {
    const date = new Date(dueDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthLabel = String(month).padStart(2, "0");

    if (periodicity === "BIMONTHLY") {
      return `${year}-B${Math.ceil(month / 2)}`;
    }

    if (periodicity === "QUARTERLY") {
      return `${year}-Q${Math.ceil(month / 3)}`;
    }

    if (periodicity === "ANNUAL") {
      return `${year}`;
    }

    if (periodicity === "WEEKLY" || periodicity === "BIWEEKLY") {
      const startOfYear = new Date(year, 0, 1);
      const week = Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
      return `${year}-W${String(week).padStart(2, "0")}`;
    }

    return `${year}-${monthLabel}`;
  }

  mapResponsibilityToObligation(responsibility, currentUserId) {
    const dueDate = responsibility.nextDate || new Date();
    const companyId = responsibility.company?._id || responsibility.company;
    const fiscalYear = new Date(dueDate).getFullYear();

    return {
      companyId,
      responsibilityId: responsibility._id,
      type: responsibility.name,
      period: this.buildPeriod(dueDate, responsibility.periodicity),
      fiscalYear,
      dueDate,
      status: this.normalizeStatus("pending", dueDate),
      assignedUserId: responsibility.responsible?._id || responsibility.responsible || null,
      taskId: null,
      submittedAt: null,
      notes: responsibility.observation || "",
      createdBy: currentUserId,
      updatedBy: currentUserId
    };
  }

  buildFilter(query) {
    const filter = {};

    if (query.companyId) {
      filter.companyId = query.companyId;
    }

    if (query.responsibilityId) {
      filter.responsibilityId = query.responsibilityId;
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.period) {
      filter.period = query.period;
    }

    if (query.fiscalYear) {
      filter.fiscalYear = Number(query.fiscalYear);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.assignedUserId) {
      filter.assignedUserId = query.assignedUserId;
    }

    if (query.dateFrom || query.dateTo) {
      filter.dueDate = {};
      if (query.dateFrom) {
        filter.dueDate.$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        filter.dueDate.$lte = new Date(query.dateTo);
      }
    }

    return filter;
  }

  async ensureCompanyExists(companyId) {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new AppError("Company not found", StatusCodes.NOT_FOUND);
    }

    return company;
  }

  async ensureResponsibilityExists(responsibilityId, companyId) {
    const responsibility = await this.taxResponsibilityRepository.findById(responsibilityId);
    if (!responsibility) {
      throw new AppError("Tax responsibility not found", StatusCodes.NOT_FOUND);
    }

    if (companyId && responsibility.company._id.toString() !== companyId.toString()) {
      throw new AppError("The responsibility does not belong to the selected company", StatusCodes.BAD_REQUEST);
    }

    return responsibility;
  }

  async create(payload, currentUser) {
    await this.ensureCompanyExists(payload.companyId);
    await this.ensureResponsibilityExists(payload.responsibilityId, payload.companyId);

    const duplicate = await this.fiscalObligationRepository.findDuplicate(payload);
    if (duplicate) {
      throw new AppError("This fiscal obligation already exists for the company and period", StatusCodes.CONFLICT);
    }

    const status = this.normalizeStatus(payload.status, payload.dueDate);
    const obligation = await this.fiscalObligationRepository.create({
      companyId: payload.companyId,
      responsibilityId: payload.responsibilityId,
      type: payload.type,
      period: payload.period,
      fiscalYear: payload.fiscalYear,
      dueDate: payload.dueDate,
      status,
      assignedUserId: payload.assignedUserId || null,
      taskId: payload.taskId || null,
      submittedAt: status === "submitted" ? payload.submittedAt || new Date() : payload.submittedAt || null,
      notes: payload.notes,
      createdBy: currentUser._id,
      updatedBy: currentUser._id
    });

    await this.auditLogService.record({
      entityName: "FiscalObligation",
      entityId: obligation._id,
      action: "CREATE",
      performedBy: currentUser._id,
      changes: obligation.toObject()
    });

    return this.fiscalObligationRepository.findById(obligation._id);
  }

  async list(query) {
    await this.syncOverdue();

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const filter = this.buildFilter(query);
    const sort = { dueDate: 1, createdAt: -1 };

    const { items, total } = await this.fiscalObligationRepository.paginate({
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

  async getById(obligationId) {
    await this.syncOverdue();

    const obligation = await this.fiscalObligationRepository.findById(obligationId);
    if (!obligation) {
      throw new AppError("Fiscal obligation not found", StatusCodes.NOT_FOUND);
    }

    return obligation;
  }

  async update(obligationId, payload, currentUser) {
    const currentObligation = await this.getById(obligationId);

    const targetCompanyId = payload.companyId || currentObligation.companyId._id.toString();
    const targetResponsibilityId =
      payload.responsibilityId || currentObligation.responsibilityId._id.toString();

    await this.ensureCompanyExists(targetCompanyId);
    await this.ensureResponsibilityExists(targetResponsibilityId, targetCompanyId);

    const nextPayload = {
      companyId: targetCompanyId,
      responsibilityId: targetResponsibilityId,
      type: payload.type || currentObligation.type,
      period: payload.period || currentObligation.period,
      fiscalYear: payload.fiscalYear || currentObligation.fiscalYear
    };

    const duplicate = await this.fiscalObligationRepository.findDuplicate(nextPayload);
    if (duplicate && duplicate._id.toString() !== obligationId) {
      throw new AppError("This fiscal obligation already exists for the company and period", StatusCodes.CONFLICT);
    }

    const nextDueDate = payload.dueDate || currentObligation.dueDate;
    const nextStatus = this.normalizeStatus(payload.status || currentObligation.status, nextDueDate);
    const updatedObligation = await this.fiscalObligationRepository.updateById(obligationId, {
      ...nextPayload,
      dueDate: nextDueDate,
      status: nextStatus,
      assignedUserId:
        payload.assignedUserId !== undefined
          ? payload.assignedUserId
          : currentObligation.assignedUserId?._id || null,
      taskId: payload.taskId !== undefined ? payload.taskId : currentObligation.taskId?._id || null,
      submittedAt:
        nextStatus === "submitted"
          ? payload.submittedAt || currentObligation.submittedAt || new Date()
          : payload.submittedAt ?? currentObligation.submittedAt,
      notes: payload.notes ?? currentObligation.notes,
      updatedBy: currentUser._id
    });

    await this.auditLogService.record({
      entityName: "FiscalObligation",
      entityId: updatedObligation._id,
      action: "UPDATE",
      performedBy: currentUser._id,
      changes: {
        before: currentObligation.toObject(),
        after: updatedObligation.toObject()
      }
    });

    return updatedObligation;
  }

  async remove(obligationId, currentUser) {
    const currentObligation = await this.getById(obligationId);
    await this.fiscalObligationRepository.deleteById(obligationId);

    await this.auditLogService.record({
      entityName: "FiscalObligation",
      entityId: obligationId,
      action: "DELETE",
      performedBy: currentUser._id,
      changes: {
        before: currentObligation.toObject()
      }
    });

    return { deleted: true };
  }

  async generateForCompany(companyId, currentUser) {
    await this.ensureCompanyExists(companyId);
    const responsibilities = await this.taxResponsibilityRepository.findByCompany(companyId);
    const activeResponsibilities = responsibilities.filter((item) => item.active !== false && item.nextDate);
    const created = [];
    const skipped = [];

    for (const responsibility of activeResponsibilities) {
      const payload = this.mapResponsibilityToObligation(responsibility, currentUser._id);
      const duplicate = await this.fiscalObligationRepository.findDuplicate(payload);

      if (duplicate) {
        skipped.push(duplicate);
      } else {
        const obligation = await this.fiscalObligationRepository.create(payload);
        created.push(obligation);
      }
    }

    if (created.length > 0) {
      await this.auditLogService.record({
        entityName: "FiscalObligation",
        entityId: companyId,
        action: "GENERATE",
        performedBy: currentUser._id,
        changes: {
          companyId,
          created: created.map((item) => item._id),
          skipped: skipped.map((item) => item._id)
        }
      });
    }

    return {
      createdCount: created.length,
      skippedCount: skipped.length,
      created
    };
  }

  async getUpcoming(days = 30, limit = 50) {
    await this.syncOverdue();

    const from = new Date();
    const to = new Date(from);
    to.setDate(to.getDate() + days);

    return this.fiscalObligationRepository.findUpcoming({ from, to, limit });
  }

  async getClientsAtRisk() {
    await this.syncOverdue();

    return this.fiscalObligationRepository.aggregate([
      {
        $match: {
          status: "overdue"
        }
      },
      {
        $group: {
          _id: "$companyId",
          overdueObligations: { $sum: 1 },
          nearestDueDate: { $min: "$dueDate" }
        }
      },
      {
        $lookup: {
          from: "companies",
          localField: "_id",
          foreignField: "_id",
          as: "company"
        }
      },
      { $unwind: "$company" },
      {
        $match: {
          "company.isDeleted": false,
          "company.status": "ACTIVE"
        }
      },
      {
        $project: {
          _id: 0,
          company: {
            id: "$company._id",
            businessName: "$company.businessName",
            nit: "$company.nit",
            verificationDigit: "$company.verificationDigit",
            municipality: "$company.municipality",
            assignedProfessional: "$company.assignedProfessional"
          },
          overdueObligations: 1,
          nearestDueDate: 1
        }
      },
      {
        $sort: {
          overdueObligations: -1,
          nearestDueDate: 1,
          "company.businessName": 1
        }
      }
    ]);
  }
}

module.exports = { FiscalObligationService };
