const { NotificationService } = require("./notification.service");
const { TaxResponsibilityRepository } = require("../../tax-responsibilities/repositories/tax-responsibility.repository");
const { TaskRepository } = require("../../tasks/repositories/task.repository");

class AlertService {
  constructor() {
    this.taskRepository = new TaskRepository();
    this.taxResponsibilityRepository = new TaxResponsibilityRepository();
    this.notificationService = new NotificationService();
  }

  calculateTrigger(dueDate) {
    if (!dueDate) {
      return null;
    }

    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startDueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const diffMs = startDueDate - startToday;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 7) return { code: "DUE_IN_7_DAYS", severity: "INFO" };
    if (diffDays === 3) return { code: "DUE_IN_3_DAYS", severity: "WARNING" };
    if (diffDays === 1) return { code: "DUE_TOMORROW", severity: "WARNING" };
    if (diffDays < 0) return { code: "OVERDUE", severity: "CRITICAL" };

    return null;
  }

  async processTaskAlerts() {
    const tasks = await this.taskRepository.findForAlerts({
      status: { $ne: "COMPLETED" }
    });

    const notifications = [];

    for (const task of tasks) {
      const trigger = this.calculateTrigger(new Date(task.dueDate));
      if (!trigger || !task.assignedTo?._id) {
        continue;
      }

      const notification = await this.notificationService.createUniqueAlert({
        user: task.assignedTo._id,
        title: `Task alert: ${task.title}`,
        message: `La tarea de ${task.company?.businessName || "empresa"} requiere atencion: ${trigger.code}.`,
        type: trigger.severity,
        referenceType: "TASK",
        referenceId: task._id,
        triggerCode: trigger.code
      });

      notifications.push(notification);
    }

    return notifications;
  }

  async processTaxResponsibilityAlerts() {
    const responsibilities = await this.taxResponsibilityRepository.findForAlerts({
      active: true,
      status: { $nin: ["COMPLETED", "INACTIVE"] }
    });

    const notifications = [];

    for (const item of responsibilities) {
      if (!item.nextDate || !item.responsible?._id) {
        continue;
      }

      const trigger = this.calculateTrigger(new Date(item.nextDate));
      if (!trigger) {
        continue;
      }

      const notification = await this.notificationService.createUniqueAlert({
        user: item.responsible._id,
        title: `Tax alert: ${item.name}`,
        message: `La obligacion tributaria de ${item.company?.businessName || "empresa"} requiere atencion: ${trigger.code}.`,
        type: trigger.severity,
        referenceType: "TAX_RESPONSIBILITY",
        referenceId: item._id,
        triggerCode: trigger.code
      });

      notifications.push(notification);
    }

    return notifications;
  }

  async processAllAlerts() {
    const [taskAlerts, taxAlerts] = await Promise.all([
      this.processTaskAlerts(),
      this.processTaxResponsibilityAlerts()
    ]);

    return {
      taskAlerts: taskAlerts.length,
      taxAlerts: taxAlerts.length,
      total: taskAlerts.length + taxAlerts.length
    };
  }
}

module.exports = { AlertService };
