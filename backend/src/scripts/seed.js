const { connectDatabase } = require("../config/database");
const { env } = require("../config/env");
const { logger } = require("../config/logger");
const { DEFAULT_ROLE_PERMISSIONS, SYSTEM_ROLES } = require("../constants/roles");
const { RoleRepository } = require("../modules/roles/repositories/role.repository");
const { UserRepository } = require("../modules/users/repositories/user.repository");
const { hashPassword } = require("../utils/password");

const roleRepository = new RoleRepository();
const userRepository = new UserRepository();

const roleLabels = {
  [SYSTEM_ROLES.SUPER_ADMIN]: "Super Admin",
  [SYSTEM_ROLES.MANAGEMENT]: "Gerencia",
  [SYSTEM_ROLES.AREA_MANAGER]: "Jefe de Area",
  [SYSTEM_ROLES.PROFESSIONAL]: "Profesional",
  [SYSTEM_ROLES.ASSISTANT]: "Auxiliar"
};

const seedRoles = async () => {
  for (const roleName of Object.values(SYSTEM_ROLES)) {
    await roleRepository.upsertSystemRole({
      name: roleName,
      label: roleLabels[roleName],
      description: `System role for ${roleLabels[roleName]}`,
      permissions: DEFAULT_ROLE_PERMISSIONS[roleName],
      isSystem: true
    });
  }
};

const seedSuperAdmin = async () => {
  const existingAdmin = await userRepository.findByEmail(env.seedSuperAdminEmail);
  if (existingAdmin) {
    logger.info("Super admin already exists. Skipping user seed.");
    return;
  }

  const role = await roleRepository.findByName(SYSTEM_ROLES.SUPER_ADMIN);
  const password = await hashPassword(env.seedSuperAdminPassword);
  const [firstName, ...restName] = env.seedSuperAdminName.split(" ");

  await userRepository.create({
    firstName,
    lastName: restName.join(" "),
    email: env.seedSuperAdminEmail,
    password,
    role: role._id,
    status: "ACTIVE"
  });

  logger.info(`Super admin created: ${env.seedSuperAdminEmail}`);
};

const run = async () => {
  await connectDatabase();
  await seedRoles();
  await seedSuperAdmin();
  logger.info("Seed completed successfully.");
  process.exit(0);
};

run().catch((error) => {
  logger.error("Seed failed", { message: error.message, stack: error.stack });
  process.exit(1);
});
