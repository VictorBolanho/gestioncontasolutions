const { StatusCodes } = require("http-status-codes");

const { sendResponse } = require("../../../utils/api-response");
const { UserService } = require("../services/user.service");

class UserController {
  constructor() {
    this.userService = new UserService();
  }

  list = async (req, res) => {
    const users = await this.userService.listActiveUsers(req.query);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Users fetched successfully",
      data: users
    });
  };
}

module.exports = { UserController };
