const { UserRepository } = require("../repositories/user.repository");

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async listActiveUsers(query) {
    return this.userRepository.listActiveUsers({
      search: query.search
    });
  }
}

module.exports = { UserService };
