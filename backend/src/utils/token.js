const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { env } = require("../config/env");

const signAccessToken = (payload) => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
};

const verifyAccessToken = (token) => jwt.verify(token, env.jwtSecret);

const generateRandomToken = () => crypto.randomBytes(32).toString("hex");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRandomToken,
  hashToken
};
