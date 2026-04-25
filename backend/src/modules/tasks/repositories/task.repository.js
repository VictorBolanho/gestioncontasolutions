const { Task } = require("../models/task.model");

class TaskRepository {
  async create(payload, options = {}) {
    return Task.create([payload], options).then((documents) => documents[0]);
  }

  async insertMany(payload, options = {}) {
    return Task.insertMany(payload, options);
  }

  async findById(taskId) {
    return Task.findById(taskId)
      .populate("company", "businessName nit city")
      .populate("assignedTo", "firstName lastName email")
      .populate("taxResponsibility", "name nextDate status")
      .populate("createdBy", "firstName lastName email")
      .populate("comments.author", "firstName lastName email");
  }

  async paginate({ filter, page, limit, sort }) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Task.find(filter)
        .populate("company", "businessName nit city")
        .populate("assignedTo", "firstName lastName email")
        .populate("taxResponsibility", "name nextDate status")
        .populate("createdBy", "firstName lastName email")
        .populate("comments.author", "firstName lastName email")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Task.countDocuments(filter)
    ]);

    return { items, total };
  }

  async updateById(taskId, payload, options = {}) {
    return Task.findByIdAndUpdate(taskId, payload, {
      new: true,
      ...options
    })
      .populate("company", "businessName nit city")
      .populate("assignedTo", "firstName lastName email")
      .populate("taxResponsibility", "name nextDate status")
      .populate("createdBy", "firstName lastName email")
      .populate("comments.author", "firstName lastName email");
  }

  async deleteById(taskId, options = {}) {
    return Task.findByIdAndDelete(taskId, options);
  }

  async updateMany(filter, payload) {
    return Task.updateMany(filter, payload);
  }

  async countDocuments(filter) {
    return Task.countDocuments(filter);
  }

  async findForAlerts(filter) {
    return Task.find(filter)
      .populate("company", "businessName")
      .populate("assignedTo", "firstName lastName email")
      .lean();
  }
}

module.exports = { TaskRepository };
