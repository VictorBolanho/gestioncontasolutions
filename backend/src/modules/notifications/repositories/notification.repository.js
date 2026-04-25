const { Notification } = require("../models/notification.model");

class NotificationRepository {
  async create(payload, options = {}) {
    return Notification.create([payload], options).then((documents) => documents[0]);
  }

  async findOne(filter) {
    return Notification.findOne(filter);
  }
}

module.exports = { NotificationRepository };
