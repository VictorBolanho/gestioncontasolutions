const { NotificationRepository } = require("../repositories/notification.repository");

class NotificationService {
  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  async createUniqueAlert({
    user,
    title,
    message,
    type,
    referenceType,
    referenceId,
    triggerCode
  }) {
    const existingNotification = await this.notificationRepository.findOne({
      user,
      referenceType,
      referenceId,
      triggerCode
    });

    if (existingNotification) {
      return existingNotification;
    }

    return this.notificationRepository.create({
      user,
      title,
      message,
      type,
      referenceType,
      referenceId,
      triggerCode,
      triggeredAt: new Date()
    });
  }
}

module.exports = { NotificationService };
