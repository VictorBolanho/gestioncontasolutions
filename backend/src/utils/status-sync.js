const { Task } = require("../modules/tasks/models/task.model");
const { TaxResponsibility } = require("../modules/tax-responsibilities/models/tax-responsibility.model");
const { FiscalObligation } = require("../modules/fiscal-obligations/models/fiscal-obligation.model");

const syncOperationalStatuses = async () => {
  const now = new Date();

  await Promise.all([
    Task.updateMany(
      {
        dueDate: { $lt: now },
        status: { $in: ["PENDING", "IN_PROGRESS"] }
      },
      {
        status: "OVERDUE"
      }
    ),
    TaxResponsibility.updateMany(
      {
        nextDate: { $lt: now },
        active: true,
        status: { $in: ["PENDING", "IN_PROGRESS"] }
      },
      {
        status: "OVERDUE"
      }
    ),
    FiscalObligation.updateMany(
      {
        dueDate: { $lt: now },
        status: { $in: ["pending", "in_progress"] }
      },
      {
        status: "overdue"
      }
    )
  ]);
};

module.exports = { syncOperationalStatuses };
