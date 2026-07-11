import { getTaskById } from "./task-service.js";
import { canUserAccessTask } from "./access-control.js";

export function canUserAccessAlert(currentUser, alert) {
  if (!alert) {
    return false;
  }

  const embeddedTask =
    alert.tarea && (String(alert.tarea.empresaId || "").trim() || String(alert.tarea.responsableId || "").trim())
      ? alert.tarea
      : null;
  const relatedTask = embeddedTask || getTaskById(alert.tareaId);
  if (relatedTask) {
    return canUserAccessTask(currentUser, relatedTask);
  }

  return false;
}
