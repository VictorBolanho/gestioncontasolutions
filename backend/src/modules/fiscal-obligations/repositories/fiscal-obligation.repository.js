const { FiscalObligation } = require("../models/fiscal-obligation.model");

class FiscalObligationRepository {
  async create(payload, options = {}) {
    return FiscalObligation.create([payload], options).then((documents) => documents[0]);
  }

  async insertMany(payload, options = {}) {
    return FiscalObligation.insertMany(payload, { ordered: false, ...options });
  }

  async findById(obligationId) {
    return FiscalObligation.findById(obligationId)
      .populate("companyId", "businessName nit verificationDigit city municipality status")
      .populate("responsibilityId", "name periodicity nextDate status")
      .populate("assignedUserId", "firstName lastName email")
      .populate("taskId", "title dueDate status");
  }

  async findDuplicate({ companyId, responsibilityId, type, period, fiscalYear }) {
    return FiscalObligation.findOne({ companyId, responsibilityId, type, period, fiscalYear });
  }

  async paginate({ filter, page, limit, sort }) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      FiscalObligation.find(filter)
        .populate("companyId", "businessName nit verificationDigit city municipality status")
        .populate("responsibilityId", "name periodicity nextDate status")
        .populate("assignedUserId", "firstName lastName email")
        .populate("taskId", "title dueDate status")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      FiscalObligation.countDocuments(filter)
    ]);

    return { items, total };
  }

  async updateById(obligationId, payload, options = {}) {
    return FiscalObligation.findByIdAndUpdate(obligationId, payload, {
      new: true,
      ...options
    })
      .populate("companyId", "businessName nit verificationDigit city municipality status")
      .populate("responsibilityId", "name periodicity nextDate status")
      .populate("assignedUserId", "firstName lastName email")
      .populate("taskId", "title dueDate status");
  }

  async deleteById(obligationId, options = {}) {
    return FiscalObligation.findByIdAndDelete(obligationId, options);
  }

  async updateMany(filter, payload) {
    return FiscalObligation.updateMany(filter, payload);
  }

  async countDocuments(filter) {
    return FiscalObligation.countDocuments(filter);
  }

  async findUpcoming({ from, to, limit = 50 }) {
    return FiscalObligation.find({
      dueDate: { $gte: from, $lte: to },
      status: { $in: ["pending", "in_progress"] }
    })
      .populate("companyId", "businessName nit verificationDigit city municipality status")
      .populate("responsibilityId", "name periodicity")
      .populate("assignedUserId", "firstName lastName email")
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(limit);
  }

  async aggregate(pipeline) {
    return FiscalObligation.aggregate(pipeline);
  }
}

module.exports = { FiscalObligationRepository };
