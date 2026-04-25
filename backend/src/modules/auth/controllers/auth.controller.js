const { StatusCodes } = require("http-status-codes");

const { AuthService } = require("../services/auth.service");
const { sendResponse } = require("../../../utils/api-response");

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  register = async (req, res) => {
    const user = await this.authService.registerUser(req.body, req.user);
    return sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      message: "User created successfully",
      data: user
    });
  };

  login = async (req, res) => {
    const result = await this.authService.login(req.body);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Login successful",
      data: result
    });
  };

  forgotPassword = async (req, res) => {
    const result = await this.authService.forgotPassword(req.body.email);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "If the email exists, reset instructions were generated",
      data: result
    });
  };

  resetPassword = async (req, res) => {
    const result = await this.authService.resetPassword(req.body.token, req.body.password);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Password reset successful",
      data: result
    });
  };

  me = async (req, res) => {
    const user = await this.authService.getProfile(req.user._id);
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Profile fetched successfully",
      data: user
    });
  };
}

module.exports = { AuthController };
