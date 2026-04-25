const { StatusCodes } = require("http-status-codes");

const { AuditLogService } = require("../../audit-logs/services/audit-log.service");
const { CompanyRepository } = require("../../companies/repositories/company.repository");
const { AlertService } = require("../../notifications/services/alert.service");
const { TaxResponsibilityRepository } = require("../../tax-responsibilities/repositories/tax-responsibility.repository");
const { TaskRepository } = require("../repositories/task.repository");
const { AppError } = require("../../../utils/app-error");
const { buildPagination } = require("../../../utils/pagination");

class TaskService {
  constructor() {
    this.taskRepository = new TaskRepository();
    this.companyRepository = new CompanyRepository();
    this.taxResponsibilityRepository = new TaxResponsibilityRepository();
    this.auditLogService = new AuditLogService();
    this.alertService = new AlertService();
  }

  async markOverdueTasks() {
    await this.taskRepository.updateMany(
      {
        dueDate: { $lt: new Date() },
        status: { $in: ["PENDING", "IN_PROGRESS"] }
      },
      {
        status: "OVERDUE"
      }
    );
  }

  async ensureCompanyExists(companyId) {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new AppError("Company not found", StatusCodes.NOT_FOUND);
    }
    return company;
  }

  async ensureResponsibilityExists(responsibilityId) {
    if (!responsibilityId) {
      return null;
    }

    const responsibility = await this.taxResponsibilityRepository.findById(responsibilityId);
    if (!responsibility) {
      throw new AppError("Tax responsibility not found", StatusCodes.NOT_FOUND);
    }

    return responsibility;
  }

  normalizeTaskStatus(payloadStatus, dueDate) {
    if (payloadStatus === "COMPLETED") {
      return "COMPLETED";
    }

    if (new Date(dueDate) < new Date()) {
      return "OVERDUE";
    }

    return payloadStatus || "PENDING";
  }

  buildFilter(query) {
    const filter = {};

    if (query.companyId) {
      filter.company = query.companyId;
    }

    if (query.assignedTo) {
      filter.assignedTo = query.assignedTo;
    }

    if (query.priority) {
      filter.priority = query.priority;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.overdue === true) {
      filter.status = "OVERDUE";
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

  async create(payload, currentUser) {
    await this.ensureCompanyExists(payload.companyId);
    const responsibility = await this.ensureResponsibilityExists(payload.responsibilityId);

    if (responsibility && responsibility.company._id.toString() !== payload.companyId) {
      throw new AppError("The responsibility does not belong to the selected company", StatusCodes.BAD_REQUEST);
    }

    const task = await this.taskRepository.create({
      title: payload.title,
      description: payload.description,
      company: payload.companyId,
      taxResponsibility: payload.responsibilityId || null,
      operationType: payload.operationType,
      assignedTo: payload.assignedTo,
      createdBy: currentUser._id,
      updatedBy: currentUser._id,
      priority: payload.priority,
      dueDate: payload.dueDate,
      status: this.normalizeTaskStatus(payload.status, payload.dueDate),
      attachments: payload.attachments,
      comments: (payload.comments || []).map((item) => ({
        content: item.content,
        author: currentUser._id
      }))
    });

    await this.auditLogService.record({
      entityName: "Task",
      entityId: task._id,
      action: "CREATE",
      performedBy: currentUser._id,
      changes: task.toObject()
    });

    return this.taskRepository.findById(task._id);
  }

  async list(query) {
    await this.markOverdueTasks();
    await this.alertService.processAllAlerts();

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const filter = this.buildFilter(query);
    const sort = { dueDate: 1, createdAt: -1 };

    const { items, total } = await this.taskRepository.paginate({
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

  async getById(taskId) {
    await this.markOverdueTasks();
    await this.alertService.processAllAlerts();

    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new AppError("Task not found", StatusCodes.NOT_FOUND);
    }

    return task;
  }

  async update(taskId, payload, currentUser) {
    const currentTask = await this.getById(taskId);

    const targetCompanyId = payload.companyId || currentTask.company._id.toString();
    await this.ensureCompanyExists(targetCompanyId);

    const targetResponsibilityId =
      payload.responsibilityId !== undefined
        ? payload.responsibilityId
        : currentTask.taxResponsibility?._id?.toString() || null;

    const responsibility = await this.ensureResponsibilityExists(targetResponsibilityId);

    if (responsibility && responsibility.company._id.toString() !== targetCompanyId) {
      throw new AppError("The responsibility does not belong to the selected company", StatusCodes.BAD_REQUEST);
    }

    const nextDueDate = payload.dueDate || currentTask.dueDate;
    const nextStatus = this.normalizeTaskStatus(payload.status || currentTask.status, nextDueDate);

    const nextComments =
      payload.comment
        ? [
            ...currentTask.comments.map((item) => ({
              _id: item._id,
              content: item.content,
              author: item.author?._id || item.author,
              createdAt: item.createdAt
            })),
            {
              content: payload.comment,
              author: currentUser._id,
              createdAt: new Date()
            }
          ]
        : undefined;

    const updatedTask = await this.taskRepository.updateById(taskId, {
      company: targetCompanyId,
      taxResponsibility: targetResponsibilityId || null,
      operationType: payload.operationType || currentTask.operationType,
      assignedTo: payload.assignedTo || currentTask.assignedTo._id,
      title: payload.title || currentTask.title,
      description: payload.description ?? currentTask.description,
      priority: payload.priority || currentTask.priority,
      dueDate: nextDueDate,
      status: nextStatus,
      attachments: payload.attachments || currentTask.attachments,
      comments: nextComments || currentTask.comments,
      updatedBy: currentUser._id
    });

    await this.auditLogService.record({
      entityName: "Task",
      entityId: updatedTask._id,
      action: "UPDATE",
      performedBy: currentUser._id,
      changes: {
        before: currentTask.toObject(),
        after: updatedTask.toObject()
      }
    });

    return updatedTask;
  }

  async remove(taskId, currentUser) {
    const currentTask = await this.getById(taskId);
    await this.taskRepository.deleteById(taskId);

    await this.auditLogService.record({
      entityName: "Task",
      entityId: taskId,
      action: "DELETE",
      performedBy: currentUser._id,
      changes: {
        before: currentTask.toObject()
      }
    });

    return { deleted: true };
  }

  async getCounters() {
    await this.markOverdueTasks();
    await this.alertService.processAllAlerts();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const [pending, overdue, today, thisWeek] = await Promise.all([
      this.taskRepository.countDocuments({ status: "PENDING" }),
      this.taskRepository.countDocuments({ status: "OVERDUE" }),
      this.taskRepository.countDocuments({
        dueDate: { $gte: startOfToday, $lt: endOfToday },
        status: { $ne: "COMPLETED" }
      }),
      this.taskRepository.countDocuments({
        dueDate: { $gte: startOfWeek, $lt: endOfWeek },
        status: { $ne: "COMPLETED" }
      })
    ]);

    return {
      pending,
      overdue,
      today,
      thisWeek
    };
  }
}

module.exports = { TaskService };
