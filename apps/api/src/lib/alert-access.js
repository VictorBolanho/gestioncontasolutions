import { canUserAccessCompany } from "./auth-service.js";

export function canUserAccessAlert(currentUser, alert) {
  if (!alert) {
    return false;
  }

  return canUserAccessCompany(currentUser, alert.empresaId) || alert.responsableId === currentUser?.id;
}
