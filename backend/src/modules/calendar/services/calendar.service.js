const { TaxResponsibilityRepository } = require("../../tax-responsibilities/repositories/tax-responsibility.repository");
const { TaskRepository } = require("../../tasks/repositories/task.repository");

class CalendarService {
  constructor() {
    this.taskRepository = new TaskRepository();
    this.taxResponsibilityRepository = new TaxResponsibilityRepository();
  }

  buildDateRange(query) {
    const now = new Date();
    const start = query.startDate ? new Date(query.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = query.endDate ? new Date(query.endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return { start, end };
  }

  async getEvents(query) {
    await this.taskRepository.updateMany(
      {
        dueDate: { $lt: new Date() },
        status: { $in: ["PENDING", "IN_PROGRESS"] }
      },
      {
        status: "OVERDUE"
      }
    );

    const { start, end } = this.buildDateRange(query);

    const taskFilter = {
      dueDate: { $gte: start, $lte: end }
    };

    const taxFilter = {
      nextDate: { $gte: start, $lte: end },
      active: true
    };

    if (query.companyId) {
      taskFilter.company = query.companyId;
      taxFilter.company = query.companyId;
    }

    if (query.assignedTo) {
      taskFilter.assignedTo = query.assignedTo;
    }

    if (query.responsible) {
      taxFilter.responsible = query.responsible;
    }

    const [tasks, taxResponsibilities] = await Promise.all([
      this.taskRepository.findForAlerts(taskFilter),
      this.taxResponsibilityRepository.findForCalendar(taxFilter)
    ]);

    const taskEvents = tasks.map((task) => ({
      id: task._id,
      type: "TASK",
      title: task.title,
      date: task.dueDate,
      status: task.status,
      priority: task.priority,
      company: task.company,
      assignedTo: task.assignedTo,
      referenceId: task._id
    }));

    const taxEvents = taxResponsibilities.map((item) => ({
      id: item._id,
      type: "TAX_RESPONSIBILITY",
      title: item.name,
      date: item.nextDate,
      status: item.status,
      priority: item.status === "OVERDUE" ? "CRITICAL" : "HIGH",
      company: item.company,
      assignedTo: item.responsible,
      referenceId: item._id
    }));

    return [...taskEvents, ...taxEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
  }
}

module.exports = { CalendarService };
