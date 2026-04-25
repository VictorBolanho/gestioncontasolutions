const { Company } = require("../models/company.model");

class CompanyRepository {
  async create(payload, options = {}) {
    return Company.create([payload], options).then((documents) => documents[0]);
  }

  async findById(companyId) {
    return Company.findOne({ _id: companyId, isDeleted: false })
      .populate("assignedProfessional", "firstName lastName email");
  }

  async findByNit(nit) {
    return Company.findOne({ nit: nit.trim(), isDeleted: false });
  }

  async paginate({ filter, page, limit, sort }) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Company.find(filter)
        .populate("assignedProfessional", "firstName lastName email")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Company.countDocuments(filter)
    ]);

    return { items, total };
  }

  async updateById(companyId, payload, options = {}) {
    return Company.findOneAndUpdate(
      { _id: companyId, isDeleted: false },
      payload,
      { new: true, ...options }
    ).populate("assignedProfessional", "firstName lastName email");
  }
}

module.exports = { CompanyRepository };
