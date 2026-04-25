const { StatusCodes } = require("http-status-codes");

const { UserRepository } = require("../modules/users/repositories/user.repository");
const { AppError } = require("../utils/app-error");
const { verifyAccessToken } = require("../utils/token");

const userRepository = new UserRepository();

const authenticate = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError("Authentication required", StatusCodes.UNAUTHORIZED);
    }

    const decoded = verifyAccessToken(token);
    const user = await userRepository.findActiveUserById(decoded.sub);

    if (!user) {
      throw new AppError("User not found or inactive", StatusCodes.UNAUTHORIZED);
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new AppError(error.message || "Invalid token", StatusCodes.UNAUTHORIZED));
  }
};

const authorize = (...requiredPermissions) => (req, res, next) => {
  const userPermissions = req.user?.role?.permissions || [];
  const hasPermission = requiredPermissions.every((permission) => userPermissions.includes(permission));

  if (!hasPermission) {
    return next(new AppError("Insufficient permissions", StatusCodes.FORBIDDEN));
  }

  return next();
};

const authorizeAny = (...acceptedPermissions) => (req, res, next) => {
  const userPermissions = req.user?.role?.permissions || [];
  const hasPermission = acceptedPermissions.some((permission) => userPermissions.includes(permission));

  if (!hasPermission) {
    return next(new AppError("Insufficient permissions", StatusCodes.FORBIDDEN));
  }

  return next();
};

module.exports = {
  authenticate,
  authorize,
  authorizeAny
};
