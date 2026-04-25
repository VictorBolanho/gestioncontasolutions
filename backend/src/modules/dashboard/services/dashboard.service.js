const { Company } = require("../../companies/models/company.model");
const { FiscalObligation } = require("../../fiscal-obligations/models/fiscal-obligation.model");
const { Notification } = require("../../notifications/models/notification.model");
const { Task } = require("../../tasks/models/task.model");
const { syncOperationalStatuses } = require("../../../utils/status-sync");

class DashboardService {
  getMonthRange() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return { startOfMonth, endOfMonth, now };
  }

  async getOverview() {
    await syncOperationalStatuses();

    const { startOfMonth, endOfMonth, now } = this.getMonthRange();
    const upcomingLimitDate = new Date(now);
    upcomingLimitDate.setDate(upcomingLimitDate.getDate() + 7);

    const [
      totalCompanies,
      activeCompanies,
      archivedCompanies,
      totalTasks,
      pendingTasks,
      overdueTasks,
      completedThisMonth,
      criticalAlerts,
      responsibilitiesUpcoming,
      clientsAtRisk
    ] = await Promise.all([
      Company.countDocuments({ isDeleted: false }),
      Company.countDocuments({ isDeleted: false, status: "ACTIVE" }),
      Company.countDocuments({
        $or: [
          { isDeleted: true },
          { isDeleted: false, status: { $in: ["INACTIVE", "SUSPENDED"] } }
        ]
      }),
      Task.countDocuments({}),
      Task.countDocuments({ status: "PENDING" }),
      Task.countDocuments({ status: "OVERDUE" }),
      Task.countDocuments({
        status: "COMPLETED",
        updatedAt: { $gte: startOfMonth, $lt: endOfMonth }
      }),
      Notification.countDocuments({
        type: "CRITICAL",
        isRead: false
      }),
      FiscalObligation.countDocuments({
        status: { $in: ["pending", "in_progress"] },
        dueDate: { $gte: now, $lte: upcomingLimitDate }
      }),
      FiscalObligation.aggregate([
        {
          $match: {
            status: "overdue"
          }
        },
        {
          $group: {
            _id: "$companyId"
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
        { $count: "total" }
      ])
    ]);

    return {
      totalCompanies,
      activeCompanies,
      archivedCompanies,
      totalTasks,
      pendingTasks,
      overdueTasks,
      completedThisMonth,
      criticalAlerts,
      responsibilitiesUpcoming,
      clientsAtRisk: clientsAtRisk[0]?.total || 0
    };
  }

  async getWorkload() {
    await syncOperationalStatuses();

    const { startOfMonth, endOfMonth } = this.getMonthRange();

    const workload = await Task.aggregate([
      {
        $group: {
          _id: "$assignedTo",
          activeTasks: {
            $sum: {
              $cond: [{ $in: ["$status", ["PENDING", "IN_PROGRESS"]] }, 1, 0]
            }
          },
          overdueTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "OVERDUE"] }, 1, 0]
            }
          },
          completedThisMonth: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "COMPLETED"] },
                    { $gte: ["$updatedAt", startOfMonth] },
                    { $lt: ["$updatedAt", endOfMonth] }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalAssigned: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          user: {
            id: "$user._id",
            firstName: "$user.firstName",
            lastName: "$user.lastName",
            email: "$user.email"
          },
          activeTasks: 1,
          overdueTasks: 1,
          completedThisMonth: 1,
          complianceScore: {
            $cond: [
              { $eq: ["$totalAssigned", 0] },
              100,
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $subtract: ["$totalAssigned", "$overdueTasks"]
                          },
                          "$totalAssigned"
                        ]
                      },
                      100
                    ]
                  },
                  2
                ]
              }
            ]
          }
        }
      },
      {
        $sort: {
          overdueTasks: -1,
          activeTasks: -1,
          complianceScore: 1
        }
      }
    ]);

    return workload;
  }

  async getCompliance() {
    await syncOperationalStatuses();

    const { startOfMonth, endOfMonth } = this.getMonthRange();

    const compliance = await Company.aggregate([
      {
        $match: {
          isDeleted: false
        }
      },
      {
        $lookup: {
          from: "tasks",
          let: { companyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$company", "$$companyId"] },
                dueDate: { $gte: startOfMonth, $lt: endOfMonth }
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                completed: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0]
                  }
                },
                overdue: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "OVERDUE"] }, 1, 0]
                  }
                }
              }
            }
          ],
          as: "taskSummary"
        }
      },
      {
        $lookup: {
          from: "fiscalobligations",
          let: { companyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$company", "$$companyId"] },
                dueDate: { $gte: startOfMonth, $lt: endOfMonth }
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                completed: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "submitted"] }, 1, 0]
                  }
                },
                overdue: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "overdue"] }, 1, 0]
                  }
                }
              }
            }
          ],
          as: "fiscalSummary"
        }
      },
      {
        $project: {
          _id: 0,
          company: {
            id: "$_id",
            businessName: "$businessName",
            nit: "$nit",
            city: "$city",
            status: "$status"
          },
          taskSummary: {
            $ifNull: [{ $arrayElemAt: ["$taskSummary", 0] }, { total: 0, completed: 0, overdue: 0 }]
          },
          fiscalSummary: {
            $ifNull: [{ $arrayElemAt: ["$fiscalSummary", 0] }, { total: 0, completed: 0, overdue: 0 }]
          }
        }
      },
      {
        $addFields: {
          totalItems: {
            $add: ["$taskSummary.total", "$fiscalSummary.total"]
          },
          completedItems: {
            $add: ["$taskSummary.completed", "$fiscalSummary.completed"]
          },
          overdueItems: {
            $add: ["$taskSummary.overdue", "$fiscalSummary.overdue"]
          }
        }
      },
      {
        $addFields: {
          compliancePercentage: {
            $cond: [
              { $eq: ["$totalItems", 0] },
              100,
              {
                $round: [
                  {
                    $multiply: [{ $divide: ["$completedItems", "$totalItems"] }, 100]
                  },
                  2
                ]
              }
            ]
          }
        }
      },
      {
        $sort: {
          overdueItems: -1,
          compliancePercentage: 1,
          "company.businessName": 1
        }
      }
    ]);

    return compliance;
  }

  async getUpcomingObligations() {
    await syncOperationalStatuses();

    const now = new Date();
    const upcomingLimitDate = new Date(now);
    upcomingLimitDate.setDate(upcomingLimitDate.getDate() + 30);

    return FiscalObligation.find({
      status: { $in: ["pending", "in_progress"] },
      dueDate: { $gte: now, $lte: upcomingLimitDate }
    })
      .populate("companyId", "businessName nit verificationDigit municipality status")
      .populate("responsibilityId", "name periodicity")
      .populate("assignedUserId", "firstName lastName email")
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(50);
  }

  async getClientsAtRisk() {
    await syncOperationalStatuses();

    return FiscalObligation.aggregate([
      { $match: { status: "overdue" } },
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
            municipality: "$company.municipality"
          },
          overdueObligations: 1,
          nearestDueDate: 1
        }
      },
      { $sort: { overdueObligations: -1, nearestDueDate: 1 } }
    ]);
  }
}

module.exports = { DashboardService };
