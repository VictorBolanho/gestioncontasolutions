const { StatusCodes } = require("http-status-codes");

const { TaskService } = require("../services/task.service");
const { sendResponse } = require("../../../utils/api-response");

class TaskController {
  constructor() {
    this.taskService = new TaskService();
  }

  create = async (req, res) => {
    const task = await this.taskService.create(req.body, req.user);
    return sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      message: "Task created successfully",
      data: task
    });
  };

  list = async (req, res) => {
    const result = await this.taskService.list(req.query);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Tasks fetched successfully",
      data: result.items,
      meta: result.meta
    });
  };

  getById = async (req, res) => {
    const task = await this.taskService.getById(req.params.taskId);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Task fetched successfully",
      data: task
    });
  };

  update = async (req, res) => {
    const task = await this.taskService.update(req.params.taskId, req.body, req.user);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Task updated successfully",
      data: task
    });
  };

  remove = async (req, res) => {
    const result = await this.taskService.remove(req.params.taskId, req.user);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Task deleted successfully",
      data: result
    });
  };

  getCounters = async (req, res) => {
    const counters = await this.taskService.getCounters();
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Task counters fetched successfully",
      data: counters
    });
  };
}

module.exports = { TaskController };
