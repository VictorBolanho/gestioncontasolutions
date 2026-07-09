import crypto from "node:crypto";
import {
  MODULE_PERMISSION_RULES,
  ROLE_LABELS,
  ROLES,
  SENSITIVE_PERMISSIONS,
  canAccessModule,
  canViewSensitiveCompanyData,
  createAuditEntry,
  getDashboardVariantForUser,
  getDefaultViewForUser,
  getEffectivePermissions,
  getPrimaryRole,
  getVisibleMenuItems,
  hasPermission,
  normalizeRole,
  normalizeUserRoles
} from "../../../../packages/domain/index.js";
import {
  getAudits,
  getCompanies,
  getOrganization,
  getSessions,
  getUsers,
  saveAudits,
  saveSessions,
  saveUsers
} from "./storage.js";

const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const OWNER_ROLES = new Set(["owner", "administrador", "gerente"]);
const SENIOR_ROLES = new Set(["senior_accountant", "supervisor"]);
const JUNIOR_ROLES = new Set(["junior_accountant", "operativo_medio", "operativo_basico"]);
const APPRENTICE_ROLES = new Set(["apprentice"]);
const ASSIGNABLE_SUPERVISOR_ROLES = new Set(["owner", "administrador", "gerente", "senior_accountant", "supervisor"]);
const SUPERVISED_ROLES = new Set([
  "junior_accountant",
  "operativo_medio",
  "operativo_basico",
  "apprentice"
]);

function createAuthError(message, statusCode = 401) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeList(value) {
  return Array.isArray(value) ? value.map((item) => normalizeText(item)).filter(Boolean) : [];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hashPassword(password, salt) {
  return crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function buildRoleLabels(roles = []) {
  return roles.map((role) => ROLE_LABELS[role] || role);
}

function normalizeStatus(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "inactive" || normalized === "inactivo") {
    return "inactivo";
  }

  return "activo";
}

function rawRoleList(user = {}) {
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles;
  }

  if (normalizeText(user.role)) {
    return [user.role];
  }

  return [];
}

function getAssignedCompanies(user = {}) {
  return normalizeList(user.assignedCompanies ?? user.empresasAsignadas);
}

function getSupervisedUsers(user = {}) {
  return normalizeList(user.supervisedUsers ?? user.usuariosSupervisados);
}

function normalizeDirectPermissions(user = {}) {
  return normalizeList(user.permissions ?? user.permisos);
}

function normalizeUserRecord(user = {}) {
  const roles = normalizeUserRoles(rawRoleList(user));
  const primaryRole = getPrimaryRole({ roles });
  const estado = normalizeStatus(user.estado ?? user.status);
  const empresasAsignadas = getAssignedCompanies(user);
  const supervisedUsers = getSupervisedUsers(user).filter((userId) => userId !== user.id);
  const supervisorId = normalizeText(user.supervisorId);
  const permisos = normalizeDirectPermissions(user);

  return {
    ...user,
    estado,
    status: estado === "activo" ? "active" : "inactive",
    roles,
    role: primaryRole,
    permisos,
    permissions: permisos,
    empresasAsignadas,
    assignedCompanies: empresasAsignadas,
    supervisedUsers,
    supervisorId
  };
}

function loadUsersDirectory() {
  return getUsers().map((user) => normalizeUserRecord(user));
}

function resolveCurrentUser(currentUser, users = loadUsersDirectory()) {
  if (!currentUser) {
    return null;
  }

  return users.find((user) => user.id === currentUser.id) || normalizeUserRecord(currentUser);
}

function isSeniorRole(role) {
  return SENIOR_ROLES.has(normalizeRole(role));
}

function isJuniorRole(role) {
  return JUNIOR_ROLES.has(normalizeRole(role));
}

function isApprenticeRole(role) {
  return APPRENTICE_ROLES.has(normalizeRole(role));
}

function canRoleSuperviseRole(supervisorRole, targetRole) {
  const normalizedSupervisorRole = normalizeRole(supervisorRole);
  const normalizedTargetRole = normalizeRole(targetRole);

  if (!normalizedSupervisorRole || !normalizedTargetRole || normalizedSupervisorRole === normalizedTargetRole) {
    return false;
  }

  if (OWNER_ROLES.has(normalizedSupervisorRole)) {
    return !OWNER_ROLES.has(normalizedTargetRole);
  }

  if (SENIOR_ROLES.has(normalizedSupervisorRole)) {
    return SUPERVISED_ROLES.has(normalizedTargetRole);
  }

  return false;
}

function getDirectReportIds(user, users = loadUsersDirectory()) {
  const targetUserId = normalizeText(user?.id);
  if (!targetUserId) {
    return [];
  }

  const explicitReports = new Set(getSupervisedUsers(user));
  users
    .filter((candidate) => normalizeText(candidate.supervisorId) === targetUserId)
    .forEach((candidate) => explicitReports.add(candidate.id));

  return Array.from(explicitReports);
}

function buildSupervisorSummary(userId, users) {
  const supervisor = users.find((user) => user.id === userId);
  if (!supervisor) {
    return null;
  }

  return {
    id: supervisor.id,
    nombreCompleto: supervisor.nombreCompleto || [supervisor.nombre, supervisor.apellido].filter(Boolean).join(" "),
    email: supervisor.email,
    role: supervisor.role,
    roleLabel: ROLE_LABELS[supervisor.role] || supervisor.role
  };
}

function buildDirectReportsSummary(user, users) {
  return getDirectReportIds(user, users)
    .map((userId) => users.find((candidate) => candidate.id === userId))
    .filter(Boolean)
    .map((candidate) => ({
      id: candidate.id,
      nombreCompleto: candidate.nombreCompleto || [candidate.nombre, candidate.apellido].filter(Boolean).join(" "),
      email: candidate.email,
      role: candidate.role,
      roleLabel: ROLE_LABELS[candidate.role] || candidate.role,
      status: candidate.status
    }));
}

function assertSupervisorRelationship(targetUser, supervisorId, users) {
  const normalizedSupervisorId = normalizeText(supervisorId);
  if (!normalizedSupervisorId) {
    return "";
  }

  const supervisor = users.find((user) => user.id === normalizedSupervisorId);
  if (!supervisor) {
    throw createAuthError("El supervisor seleccionado no existe.", 400);
  }

  if (supervisor.id === targetUser.id) {
    throw createAuthError("Un usuario no puede supervisarse a si mismo.", 400);
  }

  if (!canRoleSuperviseRole(supervisor.role, targetUser.role)) {
    throw createAuthError("El supervisor seleccionado no puede supervisar ese rol.", 400);
  }

  return normalizedSupervisorId;
}

function validateHierarchyAssignments(targetUser, users, currentUserId = null) {
  const supervisedUsers = getSupervisedUsers(targetUser);
  if (!supervisedUsers.length) {
    return;
  }

  if (!ASSIGNABLE_SUPERVISOR_ROLES.has(targetUser.role)) {
    throw createAuthError("El rol seleccionado no puede supervisar otros usuarios.", 400);
  }

  const uniqueSupervisedUsers = new Set();
  for (const supervisedUserId of supervisedUsers) {
    if (supervisedUserId === currentUserId) {
      throw createAuthError("Un usuario no puede supervisarse a si mismo.", 400);
    }

    const supervisedUser = users.find((user) => user.id === supervisedUserId);
    if (!supervisedUser) {
      throw createAuthError(`El usuario supervisado ${supervisedUserId} no existe.`, 400);
    }

    if (!canRoleSuperviseRole(targetUser.role, supervisedUser.role)) {
      throw createAuthError("Hay usuarios seleccionados con un rol no compatible para ser supervisados.", 400);
    }

    uniqueSupervisedUsers.add(supervisedUserId);
  }

  targetUser.supervisedUsers = Array.from(uniqueSupervisedUsers);
}

function syncHierarchy(users, targetUser) {
  const targetSupervisorId = normalizeText(targetUser.supervisorId);
  const desiredReports = new Set(getSupervisedUsers(targetUser));

  for (const candidate of users) {
    if (candidate.id === targetUser.id) {
      continue;
    }

    if (normalizeText(candidate.supervisorId) === targetUser.id && !desiredReports.has(candidate.id)) {
      candidate.supervisorId = "";
    }

    candidate.supervisedUsers = getSupervisedUsers(candidate).filter((userId) => userId !== targetUser.id);
  }

  for (const reportId of desiredReports) {
    const report = users.find((candidate) => candidate.id === reportId);
    if (!report) {
      continue;
    }

    report.supervisorId = targetUser.id;
  }

  if (targetSupervisorId) {
    const supervisor = users.find((candidate) => candidate.id === targetSupervisorId);
    if (supervisor) {
      supervisor.supervisedUsers = Array.from(new Set([...getSupervisedUsers(supervisor), targetUser.id]));
    }
  }

  for (const candidate of users) {
    candidate.supervisedUsers = Array.from(new Set(getSupervisedUsers(candidate)));
  }
}

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const users = loadUsersDirectory();
  const resolvedUser = users.find((candidate) => candidate.id === user.id) || normalizeUserRecord(user);
  const effectivePermissions = getEffectivePermissions(resolvedUser);
  const moduleAccess = Object.fromEntries(
    Object.keys(MODULE_PERMISSION_RULES).map((moduleName) => [moduleName, canAccessModule(resolvedUser, moduleName)])
  );
  const visibleCompanyIds = getAccessibleCompanyIds(resolvedUser, users);

  return {
    id: resolvedUser.id,
    nombre: resolvedUser.nombre,
    apellido: resolvedUser.apellido,
    nombreCompleto: resolvedUser.nombreCompleto || [resolvedUser.nombre, resolvedUser.apellido].filter(Boolean).join(" "),
    email: resolvedUser.email,
    cargo: resolvedUser.cargo || "",
    estado: resolvedUser.estado,
    status: resolvedUser.status,
    roles: [...resolvedUser.roles],
    role: resolvedUser.role,
    roleLabels: buildRoleLabels(resolvedUser.roles),
    primaryRole: resolvedUser.role,
    primaryRoleLabel: ROLE_LABELS[resolvedUser.role] || resolvedUser.role || "Usuario",
    permisos: [...resolvedUser.permisos],
    permissions: [...resolvedUser.permisos],
    permisosEfectivos: effectivePermissions,
    empresasAsignadas: [...resolvedUser.empresasAsignadas],
    assignedCompanies: [...resolvedUser.empresasAsignadas],
    supervisedUsers: [...resolvedUser.supervisedUsers],
    supervisorId: resolvedUser.supervisorId,
    supervisor: buildSupervisorSummary(resolvedUser.supervisorId, users),
    supervisedUsersDetail: buildDirectReportsSummary(resolvedUser, users),
    supervisedUsersCount: getDirectReportIds(resolvedUser, users).length,
    visibleCompanyIds,
    canViewSensitiveCompanyData: canViewSensitiveCompanyData(resolvedUser),
    moduleAccess,
    visibleMenuItems: getVisibleMenuItems(resolvedUser),
    defaultView: getDefaultViewForUser(resolvedUser),
    dashboardView: getDashboardVariantForUser(resolvedUser),
    esPortalCliente: resolvedUser.role === "cliente",
    ultimoLoginAt: resolvedUser.ultimoLoginAt || null,
    createdAt: resolvedUser.createdAt,
    updatedAt: resolvedUser.updatedAt
  };
}

export function assertPermission(user, permission, message = "No tienes permisos para ejecutar esta accion.") {
  if (!hasPermission(user, permission)) {
    throw createAuthError(message, 403);
  }
}

export function getAccessibleCompanyIds(user, users = loadUsersDirectory()) {
  if (!user) {
    return [];
  }

  const resolvedUser = resolveCurrentUser(user, users);
  if (!resolvedUser) {
    return [];
  }

  if (hasPermission(resolvedUser, "ver_todas_empresas")) {
    return getCompanies().map((company) => company.id);
  }

  const companyIds = new Set(getAssignedCompanies(resolvedUser));
  if (isSeniorRole(resolvedUser.role)) {
    for (const reportId of getDirectReportIds(resolvedUser, users)) {
      const report = users.find((candidate) => candidate.id === reportId);
      getAssignedCompanies(report).forEach((companyId) => companyIds.add(companyId));
    }
  }

  return Array.from(companyIds);
}

export function canUserAccessCompany(user, companyId) {
  const normalizedCompanyId = normalizeText(companyId);
  if (!normalizedCompanyId) {
    return false;
  }

  return getAccessibleCompanyIds(user).includes(normalizedCompanyId);
}

export function getAccessibleCompanyIdsForTaskOnly(user) {
  return getAccessibleCompanyIds(user);
}

export function listUsers(currentUser) {
  assertPermission(currentUser, "ver_modulo_usuarios");
  const users = loadUsersDirectory();
  const actor = resolveCurrentUser(currentUser, users);
  if (!actor) {
    return [];
  }

  const canSeeAllUsers = OWNER_ROLES.has(actor.role) || hasPermission(actor, "ver_permisos_sensibles");
  const visibleUserIds = new Set([actor.id, ...getDirectReportIds(actor, users)]);

  return users
    .filter((user) => canSeeAllUsers || visibleUserIds.has(user.id))
    .map(sanitizeUser)
    .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, "es"));
}

export function listSupervisedUsers(currentUser) {
  const users = loadUsersDirectory();
  const actor = resolveCurrentUser(currentUser, users);
  if (!actor) {
    return [];
  }

  return getDirectReportIds(actor, users)
    .map((userId) => users.find((candidate) => candidate.id === userId))
    .filter(Boolean)
    .map(sanitizeUser)
    .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, "es"));
}

function validateUserPayload(payload, existingUsers, currentUserId = null) {
  const errors = [];
  const email = normalizeEmail(payload.email);
  const roles = normalizeUserRoles(payload.roles);
  const role = roles[0] || normalizeRole(payload.role);
  const companyIds = new Set(getCompanies().map((company) => company.id));
  const invalidCompanyIds = getAssignedCompanies(payload).filter((companyId) => !companyIds.has(companyId));

  if (!normalizeText(payload.nombre)) {
    errors.push("El nombre es obligatorio.");
  }

  if (!email) {
    errors.push("El correo es obligatorio.");
  }

  if (roles.length !== 1) {
    errors.push("Debes asignar exactamente un rol principal.");
  }

  if (!["activo", "inactivo"].includes(normalizeStatus(payload.estado || payload.status || "activo"))) {
    errors.push("El estado del usuario no es valido.");
  }

  const invalidRoles = roles.filter((item) => !ROLES.includes(item));
  if (invalidRoles.length > 0) {
    errors.push(`Hay roles no permitidos: ${invalidRoles.join(", ")}.`);
  }

  if (invalidCompanyIds.length > 0) {
    errors.push(`Hay empresas asignadas no validas: ${invalidCompanyIds.join(", ")}.`);
  }

  const duplicated = existingUsers.some((user) => user.id !== currentUserId && normalizeEmail(user.email) === email);
  if (duplicated) {
    errors.push("Ya existe un usuario con ese correo.");
  }

  if (payload.password !== undefined && normalizeText(payload.password).length > 0 && normalizeText(payload.password).length < 10) {
    errors.push("La contrasena debe tener al menos 10 caracteres.");
  }

  if (isApprenticeRole(role) && getAssignedCompanies(payload).length > 0) {
    errors.push("Los aprendices deben trabajar con tareas asignadas, no con carteras completas de empresas.");
  }

  if (errors.length > 0) {
    throw createAuthError(errors.join(" "), 400);
  }
}

function normalizeUserPayload(payload, fallback = {}) {
  const roles = normalizeUserRoles(Array.isArray(payload.roles) ? payload.roles : rawRoleList(payload));
  const nombre = normalizeText(payload.nombre ?? fallback.nombre);
  const apellido = normalizeText(payload.apellido ?? fallback.apellido);
  const explicitFullName = normalizeText(payload.nombreCompleto || "");
  const permisos = Array.isArray(payload.permisos)
    ? normalizeList(payload.permisos)
    : normalizeDirectPermissions(fallback);
  const empresasAsignadas = Array.isArray(payload.empresasAsignadas)
    ? normalizeList(payload.empresasAsignadas)
    : getAssignedCompanies(fallback);
  const supervisedUsers = Array.isArray(payload.supervisedUsers)
    ? normalizeList(payload.supervisedUsers)
    : getSupervisedUsers(fallback);

  return normalizeUserRecord({
    ...fallback,
    nombre,
    apellido,
    nombreCompleto: explicitFullName || [nombre, apellido].filter(Boolean).join(" "),
    email: normalizeEmail(payload.email ?? fallback.email),
    cargo: normalizeText(payload.cargo ?? fallback.cargo),
    estado: normalizeStatus(payload.estado ?? payload.status ?? fallback.estado ?? "activo"),
    roles,
    permisos,
    empresasAsignadas,
    supervisedUsers,
    supervisorId: normalizeText(payload.supervisorId ?? fallback.supervisorId),
    password: payload.password
  });
}

function assertCanAssignDirectPermissions(actor, permisos = []) {
  if (permisos.length > 0 && !hasPermission(actor, "asignar_permisos")) {
    throw createAuthError("No tienes permisos para asignar permisos directos.", 403);
  }

  const sensitivePermissions = permisos.filter((permission) => SENSITIVE_PERMISSIONS.includes(permission));
  if (sensitivePermissions.length > 0 && !hasPermission(actor, "asignar_permisos")) {
    throw createAuthError("No tienes permisos para asignar permisos sensibles.", 403);
  }
}

function sameStringList(left = [], right = []) {
  const normalizedLeft = normalizeList(left).sort();
  const normalizedRight = normalizeList(right).sort();
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((item, index) => item === normalizedRight[index])
  );
}

function validateHierarchy(normalized, users, currentUserId = null) {
  normalized.supervisorId = assertSupervisorRelationship(normalized, normalized.supervisorId, users);
  validateHierarchyAssignments(normalized, users, currentUserId || normalized.id);
}

export function createUser(payload, actor) {
  assertPermission(actor, "crear_usuarios");
  const users = loadUsersDirectory();
  const normalized = normalizeUserPayload(payload);
  validateUserPayload(normalized, users);
  assertCanAssignDirectPermissions(actor, normalized.permisos);
  validateHierarchy(normalized, users);

  if (!normalizeText(normalized.password)) {
    throw createAuthError("La contrasena es obligatoria para crear el usuario.", 400);
  }

  const now = new Date().toISOString();
  const passwordSalt = crypto.randomBytes(8).toString("hex");
  const passwordHash = hashPassword(normalized.password, passwordSalt);
  const nextUser = normalizeUserRecord({
    id: createId("usr"),
    nombre: normalized.nombre,
    apellido: normalized.apellido,
    nombreCompleto: normalized.nombreCompleto || [normalized.nombre, normalized.apellido].filter(Boolean).join(" "),
    email: normalized.email,
    cargo: normalized.cargo,
    estado: normalized.estado,
    roles: normalized.roles,
    permisos: normalized.permisos,
    empresasAsignadas: normalized.empresasAsignadas,
    supervisedUsers: normalized.supervisedUsers,
    supervisorId: normalized.supervisorId,
    passwordSalt,
    passwordHash,
    ultimoLoginAt: null,
    createdAt: now,
    updatedAt: now
  });

  users.push(nextUser);
  syncHierarchy(users, nextUser);
  saveUsers(users);

  const organization = getOrganization();
  const audits = getAudits();
  audits.push(
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor.id,
      accion: "crear_usuario",
      modulo: "usuarios",
      recursoTipo: "usuario",
      recursoId: nextUser.id,
      descripcion: `Se creo el usuario ${nextUser.nombreCompleto}.`,
      valorNuevo: sanitizeUser(nextUser)
    })
  );
  saveAudits(audits);

  return sanitizeUser(nextUser);
}

export function updateUser(userId, payload, actor) {
  assertPermission(actor, "editar_usuarios");
  const users = loadUsersDirectory();
  const current = users.find((user) => user.id === userId);

  if (!current) {
    throw createAuthError("Usuario no encontrado.", 404);
  }

  const normalized = normalizeUserPayload(payload, current);
  validateUserPayload(normalized, users, userId);
  if (!sameStringList(normalized.permisos, current.permisos)) {
    assertCanAssignDirectPermissions(actor, normalized.permisos);
  }
  validateHierarchy(normalized, users, userId);

  if (current.id === actor.id && normalized.estado !== "activo") {
    throw createAuthError("No puedes desactivar tu propio usuario activo.", 400);
  }

  if (current.id === actor.id && OWNER_ROLES.has(current.role) && !OWNER_ROLES.has(normalized.role)) {
    throw createAuthError("No puedes quitarte el rol administrativo principal desde tu propio usuario.", 400);
  }

  const previous = sanitizeUser(current);
  current.nombre = normalized.nombre;
  current.apellido = normalized.apellido;
  current.nombreCompleto = normalized.nombreCompleto || [normalized.nombre, normalized.apellido].filter(Boolean).join(" ");
  current.email = normalized.email;
  current.cargo = normalized.cargo;
  current.estado = normalized.estado;
  current.status = normalized.status;
  current.roles = normalized.roles;
  current.role = normalized.role;
  current.permisos = normalized.permisos;
  current.permissions = normalized.permisos;
  current.empresasAsignadas = normalized.empresasAsignadas;
  current.assignedCompanies = normalized.empresasAsignadas;
  current.supervisedUsers = normalized.supervisedUsers;
  current.supervisorId = normalized.supervisorId;
  current.updatedAt = new Date().toISOString();

  if (normalizeText(normalized.password)) {
    current.passwordSalt = crypto.randomBytes(8).toString("hex");
    current.passwordHash = hashPassword(normalized.password, current.passwordSalt);
  }

  syncHierarchy(users, current);
  saveUsers(users);

  const organization = getOrganization();
  const audits = getAudits();
  audits.push(
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor.id,
      accion: "actualizar_usuario",
      modulo: "usuarios",
      recursoTipo: "usuario",
      recursoId: current.id,
      descripcion: `Se actualizo el usuario ${current.nombreCompleto}.`,
      valorAnterior: previous,
      valorNuevo: sanitizeUser(current)
    })
  );
  saveAudits(audits);

  return sanitizeUser(current);
}

function cleanupExpiredSessions(sessions) {
  const now = Date.now();
  return sessions.filter((session) => {
    const expiresAt = new Date(session.expiresAt || 0).getTime();
    return Number.isFinite(expiresAt) && expiresAt > now;
  });
}

export function login(email, password) {
  const users = loadUsersDirectory();
  const user = users.find((candidate) => normalizeEmail(candidate.email) === normalizeEmail(email));

  if (!user || user.estado !== "activo") {
    throw createAuthError("Credenciales invalidas.", 401);
  }

  const expectedHash = hashPassword(password, user.passwordSalt);
  if (expectedHash !== user.passwordHash) {
    throw createAuthError("Credenciales invalidas.", 401);
  }

  const sessions = cleanupExpiredSessions(getSessions());
  const now = new Date();
  const token = crypto.randomBytes(24).toString("hex");
  sessions.push({
    token,
    userId: user.id,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString()
  });
  saveSessions(sessions);

  user.ultimoLoginAt = now.toISOString();
  user.updatedAt = now.toISOString();
  saveUsers(users);

  const organization = getOrganization();
  const audits = getAudits();
  audits.push(
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: user.id,
      accion: "login",
      modulo: "autenticacion",
      recursoTipo: "sesion",
      recursoId: token,
      descripcion: `Inicio de sesion del usuario ${user.nombreCompleto || user.email}.`,
      valorNuevo: {
        token,
        userId: user.id,
        createdAt: now.toISOString()
      }
    })
  );
  saveAudits(audits);

  return {
    token,
    user: sanitizeUser(user)
  };
}

export function logout(token) {
  const sessions = cleanupExpiredSessions(getSessions());
  const nextSessions = sessions.filter((session) => session.token !== token);
  saveSessions(nextSessions);
}

export function getSessionUser(token) {
  if (!normalizeText(token)) {
    return null;
  }

  const sessions = cleanupExpiredSessions(getSessions());
  saveSessions(sessions);

  const session = sessions.find((item) => item.token === token);
  if (!session) {
    return null;
  }

  const user = loadUsersDirectory().find((candidate) => candidate.id === session.userId && candidate.estado === "activo");
  return user || null;
}

export function getSessionSummary(token) {
  const user = getSessionUser(token);
  if (!user) {
    return null;
  }

  return {
    user: sanitizeUser(user),
    accessibleCompanyIds: getAccessibleCompanyIds(user)
  };
}

export function filterCompaniesForUser(companies, user) {
  const visibleIds = new Set(getAccessibleCompanyIds(user));
  if (hasPermission(user, "ver_todas_empresas")) {
    return clone(companies);
  }

  return clone(companies.filter((company) => visibleIds.has(company.id)));
}
