const { StatusCodes } = require("http-status-codes");

const { env } = require("../../../config/env");
const { SYSTEM_ROLES } = require("../../../constants/roles");
const { RoleRepository } = require("../../roles/repositories/role.repository");
const { UserRepository } = require("../../users/repositories/user.repository");
const { AppError } = require("../../../utils/app-error");
const { comparePassword, hashPassword } = require("../../../utils/password");
const { generateRandomToken, hashToken, signAccessToken } = require("../../../utils/token");

class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.roleRepository = new RoleRepository();
  }

  async registerUser(payload, currentUser) {
    const existingUser = await this.userRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new AppError("Email is already in use", StatusCodes.CONFLICT);
    }

    const role = await this.roleRepository.findByName(payload.roleName || SYSTEM_ROLES.PROFESSIONAL);
    if (!role) {
      throw new AppError("Assigned role not found", StatusCodes.BAD_REQUEST);
    }

    const password = await hashPassword(payload.password);
    const user = await this.userRepository.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password,
      phone: payload.phone,
      role: role._id,
      createdBy: currentUser?._id || null,
      updatedBy: currentUser?._id || null
    });

    return this.userRepository.findById(user._id);
  }

  async login(payload) {
    const user = await this.userRepository.findByEmail(payload.email, { includePassword: true });

    if (!user) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }

    if (user.status !== "ACTIVE") {
      throw new AppError("User is not active", StatusCodes.FORBIDDEN);
    }

    const isPasswordValid = await comparePassword(payload.password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = signAccessToken({
      sub: user._id.toString(),
      role: user.role.name,
      permissions: user.role.permissions
    });

    return {
      accessToken,
      user: user.toJSON()
    };
  }

  async forgotPassword(email) {
    const user = await this.userRepository.findByEmail(email, { includePassword: true });

    if (!user) {
      return { delivered: true };
    }

    const resetToken = generateRandomToken();
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpiresAt = new Date(Date.now() + env.passwordResetTokenExpiresMinutes * 60 * 1000);
    await user.save();

    return {
      delivered: true,
      resetToken: env.nodeEnv === "development" ? resetToken : undefined
    };
  }

  async resetPassword(token, newPassword) {
    const hashedResetToken = hashToken(token);
    const user = await this.userRepository.findByResetToken(hashedResetToken);

    if (!user) {
      throw new AppError("Invalid or expired reset token", StatusCodes.BAD_REQUEST);
    }

    user.password = await hashPassword(newPassword);
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    await user.save();

    return { reset: true };
  }

  async getProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }
    return user;
  }
}

module.exports = { AuthService };
