const { Company } = require("../../companies/models/company.model");
const { Task } = require("../../tasks/models/task.model");
const { syncOperationalStatuses } = require("../../../utils/status-sync");

class ReportService {
  buildTaskMatch(query) {
    const match = {};

    if (query.startDate || query.endDate) {
      match.dueDate = {};
      if (query.startDate) {
        match.dueDate.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        match.dueDate.$lte = new Date(query.endDate);
      }
    }

    if (query.userId) {
      match.assignedTo = query.userId;
    }

    if (query.companyId) {
      match.company = query.companyId;
    }

    if (query.status) {
      match.status = query.status;
    }

    return match;
  }

  async getTasksReport(query) {
    await syncOperationalStatuses();

    const match = this.buildTaskMatch(query);

    return Task.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "companies",
          localField: "company",
          foreignField: "_id",
          as: "company"
        }
      },
      { $unwind: "$company" },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedTo"
        }
      },
      { $unwind: "$assignedTo" },
      {
        $project: {
          _id: 0,
          id: "$_id",
          title: 1,
          priority: 1,
          status: 1,
          dueDate: 1,
          company: {
            id: "$company._id",
            businessName: "$company.businessName",
            nit: "$company.nit"
          },
          assignedTo: {
            id: "$assignedTo._id",
            firstName: "$assignedTo.firstName",
            lastName: "$assignedTo.lastName",
            email: "$assignedTo.email"
          },
          createdAt: 1,
          updatedAt: 1
        }
      },
      {
        $sort: {
          dueDate: 1,
          priority: -1,
          createdAt: -1
        }
      }
    ]);
  }

  async getCompaniesRiskReport() {
    await syncOperationalStatuses();

    const now = new Date();
    const upcomingLimitDate = new Date(now);
    upcomingLimitDate.setDate(upcomingLimitDate.getDate() + 7);

    return Company.aggregate([
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
                $expr: { $eq: ["$company", "$$companyId"] }
              }
            },
            {
              $group: {
                _id: null,
                overdueTasks: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "OVERDUE"] }, 1, 0]
                  }
                },
                delayedTasks: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ["$status", "COMPLETED"] },
                          { $gt: ["$updatedAt", "$dueDate"] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ],
          as: "taskMetrics"
        }
      },
      {
        $lookup: {
          from: "taxresponsibilities",
          let: { companyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$company", "$$companyId"] },
                active: true
              }
            },
            {
              $group: {
                _id: null,
                upcomingResponsibilities: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gte: ["$nextDate", now] },
                          { $lte: ["$nextDate", upcomingLimitDate] },
                          { $ne: ["$status", "COMPLETED"] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                },
                overdueResponsibilities: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "OVERDUE"] }, 1, 0]
                  }
                }
              }
            }
          ],
          as: "taxMetrics"
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
          taskMetrics: {
            $ifNull: [{ $arrayElemAt: ["$taskMetrics", 0] }, { overdueTasks: 0, delayedTasks: 0 }]
          },
          taxMetrics: {
            $ifNull: [
              { $arrayElemAt: ["$taxMetrics", 0] },
              { upcomingResponsibilities: 0, overdueResponsibilities: 0 }
            ]
          }
        }
      },
      {
        $addFields: {
          overdueTasks: "$taskMetrics.overdueTasks",
          upcomingResponsibilities: "$taxMetrics.upcomingResponsibilities",
          delays: {
            $add: ["$taskMetrics.delayedTasks", "$taxMetrics.overdueResponsibilities"]
          },
          riskScore: {
            $add: [
              { $multiply: ["$taskMetrics.overdueTasks", 3] },
              { $multiply: ["$taxMetrics.upcomingResponsibilities", 2] },
              { $multiply: ["$taskMetrics.delayedTasks", 2] },
              "$taxMetrics.overdueResponsibilities"
            ]
          }
        }
      },
      {
        $project: {
          company: 1,
          overdueTasks: 1,
          upcomingResponsibilities: 1,
          delays: 1,
          riskScore: 1
        }
      },
      {
        $sort: {
          riskScore: -1,
          overdueTasks: -1,
          upcomingResponsibilities: -1
        }
      }
    ]);
  }

  escapeCsvValue(value) {
    const normalized = value === null || value === undefined ? "" : String(value);
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  toCsv(rows) {
    if (!rows || rows.length === 0) {
      return "";
    }

    const headers = Object.keys(rows[0]);
    const headerLine = headers.map((header) => this.escapeCsvValue(header)).join(",");
    const dataLines = rows.map((row) =>
      headers.map((header) => this.escapeCsvValue(row[header])).join(",")
    );

    return [headerLine, ...dataLines].join("\n");
  }

  flattenTaskRows(rows) {
    return rows.map((item) => ({
      id: item.id,
      title: item.title,
      priority: item.priority,
      status: item.status,
      dueDate: item.dueDate,
      company: item.company?.businessName || "",
      companyNit: item.company?.nit || "",
      assignedTo: `${item.assignedTo?.firstName || ""} ${item.assignedTo?.lastName || ""}`.trim(),
      assignedEmail: item.assignedTo?.email || "",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
  }

  flattenCompanyRiskRows(rows) {
    return rows.map((item) => ({
      company: item.company?.businessName || "",
      nit: item.company?.nit || "",
      city: item.company?.city || "",
      status: item.company?.status || "",
      overdueTasks: item.overdueTasks,
      upcomingResponsibilities: item.upcomingResponsibilities,
      delays: item.delays,
      riskScore: item.riskScore
    }));
  }

  async exportCsv(query) {
    const reportType = query.type || "tasks";

    if (reportType === "companies") {
      const data = await this.getCompaniesRiskReport();
      return {
        filename: "companies-risk-report.csv",
        content: this.toCsv(this.flattenCompanyRiskRows(data))
      };
    }

    const data = await this.getTasksReport(query);
    return {
      filename: "tasks-report.csv",
      content: this.toCsv(this.flattenTaskRows(data))
    };
  }
}

module.exports = { ReportService };
