export const TASK_TYPES = Object.freeze([
  "fiscal",
  "contable",
  "administrativa",
  "operativa",
  "comercial",
  "interna",
  "cliente"
]);

export const TASK_ORIGINS = Object.freeze([
  "calendario_fiscal",
  "manual_gerente",
  "plantilla_recurrente",
  "solicitud_cliente",
  "ajuste_interno",
  "sistema"
]);

export const TASK_GENERAL_STATUS = Object.freeze([
  "pendiente",
  "asignada",
  "en_proceso",
  "en_revision",
  "completada",
  "rechazada",
  "vencida",
  "cancelada",
  "no_aplica"
]);

export const TASK_FISCAL_PAYMENT_STATUS = Object.freeze([
  "no_aplica",
  "pendiente_pago",
  "enviado_al_cliente",
  "pagado",
  "pagado_fuera_de_fecha",
  "no_pagado_por_cliente",
  "sin_soporte_pago",
  "requiere_revision"
]);

export const TASK_PRIORITIES = Object.freeze([
  "baja",
  "media",
  "alta",
  "critica"
]);

export function isFiscalTask(task) {
  return task?.tipoTarea === "fiscal";
}

export function canCreateTaskForCompany(company) {
  return company ? company.estadoEmpresa === "activa" : false;
}

export function createTask(task, company) {
  if (!canCreateTaskForCompany(company)) {
    throw new Error(
      "No se pueden generar nuevas tareas para empresas suspendidas, inactivas o archivadas."
    );
  }

  return {
    ...task,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

