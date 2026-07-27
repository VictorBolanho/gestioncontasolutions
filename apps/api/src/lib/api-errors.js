import crypto from "node:crypto";
import { sendJson } from "./http.js";

const SENSITIVE_PATTERN =
  /(authorization|bearer|password|contrasena|token|cookie|postgres(?:ql)?:\/\/)[^\s,;]*/gi;

function correlationId() {
  return crypto.randomUUID();
}

function safeLogDetail(error) {
  const message = String(error?.message || "Error interno sin detalle")
    .replace(SENSITIVE_PATTERN, "$1=[REDACTED]")
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, 1000);
  return {
    name: String(error?.name || "Error").slice(0, 100),
    code: String(error?.code || "").slice(0, 100),
    message
  };
}

export function sendApiFailure(
  response,
  error,
  fallbackMessage = "No se pudo completar la operacion.",
  { logger = console.error, defaultStatusCode = 500 } = {}
) {
  const rawStatus = Number(error?.statusCode);
  const looksInternal =
    /^(?:23|42|ECONN|EPIPE|ETIMEDOUT)/i.test(String(error?.code || "")) ||
    String(error?.name || "") === "DatabaseError";
  const statusCode =
    Number.isInteger(rawStatus) && rawStatus >= 400 && rawStatus < 600
      ? rawStatus
      : looksInternal
        ? 500
        : defaultStatusCode;
  if (statusCode < 500) {
    const headers = error?.closeConnection ? { Connection: "close" } : {};
    sendJson(response, statusCode, { error: error?.message || fallbackMessage }, headers);
    return { statusCode };
  }

  const id = correlationId();
  logger(
    JSON.stringify({
      event: "api_internal_error",
      correlationId: id,
      ...safeLogDetail(error)
    })
  );
  sendJson(
    response,
    500,
    {
      error: "Ocurrio un error interno. Intenta nuevamente.",
      correlationId: id
    },
    { "X-Correlation-ID": id }
  );
  return { statusCode: 500, correlationId: id };
}
