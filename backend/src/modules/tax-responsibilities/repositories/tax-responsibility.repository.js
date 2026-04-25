const { TaxResponsibility } = require("../models/tax-responsibility.model");

class TaxResponsibilityRepository {
  async create(payload, options = {}) {
    return TaxResponsibility.create([payload], options).then((documents) => documents[0]);
  }

  async insertMany(payload, options = {}) {
    return TaxResponsibility.insertMany(payload, options);
  }

  async findById(responsibilityId) {
    return TaxResponsibility.findById(responsibilityId)
      .populate("company", "businessName nit")
      .populate("responsible", "firstName lastName email");
  }

  async findByCompanyAndName(companyId, name) {
    return TaxResponsibility.findOne({ company: companyId, name });
  }

  async paginate({ filter, page, limit, sort }) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      TaxResponsibility.find(filter)
        .populate("company", "businessName nit city")
        .populate("responsible", "firstName lastName email")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      TaxResponsibility.countDocuments(filter)
    ]);

    return { items, total };
  }

  async findByCompany(companyId) {
    return TaxResponsibility.find({ company: companyId })
      .populate("responsible", "firstName lastName email")
      .sort({ nextDate: 1, createdAt: -1 });
  }

  async findForCalendar(filter) {
    return TaxResponsibility.find(filter)
      .populate("company", "businessName nit city")
      .populate("responsible", "firstName lastName email")
      .sort({ nextDate: 1, createdAt: -1 })
      .lean();
  }

  async findForAlerts(filter) {
    return TaxResponsibility.find(filter)
      .populate("company", "businessName")
      .populate("responsible", "firstName lastName email")
      .lean();
  }

  async updateById(responsibilityId, payload, options = {}) {
    return TaxResponsibility.findByIdAndUpdate(responsibilityId, payload, {
      new: true,
      ...options
    })
      .populate("company", "businessName nit")
      .populate("responsible", "firstName lastName email");
  }

  async deleteById(responsibilityId, options = {}) {
    return TaxResponsibility.findByIdAndDelete(responsibilityId, options);
  }

  async deleteManyByCompany(companyId, options = {}) {
    return TaxResponsibility.deleteMany({ company: companyId }, options);
  }
}

module.exports = { TaxResponsibilityRepository };
