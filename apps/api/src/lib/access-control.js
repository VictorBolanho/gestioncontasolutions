import { hasPermission, getPrimaryRole } from "../../../../packages/domain/index.js";
import { canUserAccessCompany } from "./auth-service.js";

const OWNER_ROLES = new Set(["owner", "administrador", "gerente"]);
const SENIOR_ROLES = new Set(["senior_accountant", "supervisor"]);
const JUNIOR_ROLES = new Set(["junior_accountant", "operativo_medio", "operativo_basico"]);

function supervisedUserIds(currentUser) {
  return new Set(Array.isArray(currentUser?.supervisedUsers) ? currentUser.supervisedUsers : []);
}

export function canUserAccessTask(currentUser, task) {
  if (!task || !currentUser) {
    return false;
  }

  const primaryRole = getPrimaryRole(currentUser);
  const isCompanyVisible = canUserAccessCompany(currentUser, task.empresaId);
  const supervisedUsers = supervisedUserIds(currentUser);

  if (hasPermission(currentUser, "ver_todas_empresas") || OWNER_ROLES.has(primaryRole)) {
    return true;
  }

  if (primaryRole === "cliente") {
    return task.visibleParaCliente === true && (!task.clienteUsuarioId || task.clienteUsuarioId === currentUser?.id);
  }

  if (SENIOR_ROLES.has(primaryRole)) {
    return isCompanyVisible || task.responsableId === currentUser?.id || supervisedUsers.has(task.responsableId);
  }

  if (JUNIOR_ROLES.has(primaryRole)) {
    return task.responsableId === currentUser?.id || task.creadoPor === currentUser?.id;
  }

  if (primaryRole === "apprentice") {
    return task.responsableId === currentUser?.id;
  }

  return isCompanyVisible;
}

export function canManageTaskAsReviewer(currentUser, task) {
  if (!task || !currentUser) {
    return false;
  }

  const primaryRole = getPrimaryRole(currentUser);
  if (OWNER_ROLES.has(primaryRole) || hasPermission(currentUser, "ver_todas_empresas")) {
    return true;
  }

  if (SENIOR_ROLES.has(primaryRole)) {
    const supervisedUsers = supervisedUserIds(currentUser);
    return task.responsableId === currentUser?.id || supervisedUsers.has(task.responsableId);
  }

  return task.responsableId === currentUser?.id;
}
