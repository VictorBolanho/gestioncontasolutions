const bcrypt = require("bcryptjs");

const hashPassword = async (plainPassword) => bcrypt.hash(plainPassword, 12);
const comparePassword = async (plainPassword, hashedPassword) => bcrypt.compare(plainPassword, hashedPassword);

module.exports = {
  hashPassword,
  comparePassword
};
