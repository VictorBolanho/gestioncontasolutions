const { StatusCodes } = require("http-status-codes");

const { AlertService } = require("../../notifications/services/alert.service");
const { sendResponse } = require("../../../utils/api-response");
const { CalendarService } = require("../services/calendar.service");

class CalendarController {
  constructor() {
    this.calendarService = new CalendarService();
    this.alertService = new AlertService();
  }

  getEvents = async (req, res) => {
    await this.alertService.processAllAlerts();
    const events = await this.calendarService.getEvents(req.query);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Calendar events fetched successfully",
      data: events
    });
  };
}

module.exports = { CalendarController };
