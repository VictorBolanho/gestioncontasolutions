const BODY_CONFIG_LIMITS = Object.freeze({
  maxBytes: 100 * 1024 * 1024,
  maxTimeoutMs: 120000
});

const BODY_CONFIG_DEFAULTS = Object.freeze({
  global: 12 * 1024 * 1024,
  json: 1024 * 1024,
  login: 16 * 1024,
  multipart: 10 * 1024 * 1024,
  timeoutMs: 15000
});

function configuredInteger(name, fallback, maximum) {
  const raw = String(process.env[name] ?? "").trim();
  if (!raw) {
    return fallback;
  }
  if (!/^[1-9][0-9]*$/.test(raw)) {
    throw new Error(`${name} debe ser un entero positivo.`);
  }
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    throw new Error(`${name} excede el maximo permitido (${maximum}).`);
  }
  return parsed;
}

export function getHttpBodyConfiguration() {
  const globalMaxBytes = configuredInteger(
    "HTTP_BODY_MAX_BYTES",
    BODY_CONFIG_DEFAULTS.global,
    BODY_CONFIG_LIMITS.maxBytes
  );
  const timeoutMs = configuredInteger(
    "HTTP_BODY_TIMEOUT_MS",
    BODY_CONFIG_DEFAULTS.timeoutMs,
    BODY_CONFIG_LIMITS.maxTimeoutMs
  );
  const configuredLimits = {
    json: configuredInteger("HTTP_JSON_MAX_BYTES", BODY_CONFIG_DEFAULTS.json, BODY_CONFIG_LIMITS.maxBytes),
    login: configuredInteger("HTTP_LOGIN_MAX_BYTES", BODY_CONFIG_DEFAULTS.login, BODY_CONFIG_LIMITS.maxBytes),
    multipart: configuredInteger(
      "HTTP_MULTIPART_MAX_BYTES",
      BODY_CONFIG_DEFAULTS.multipart,
      BODY_CONFIG_LIMITS.maxBytes
    )
  };
  return Object.freeze({
    globalMaxBytes,
    timeoutMs,
    limits: Object.freeze(
      Object.fromEntries(
        Object.entries(configuredLimits).map(([name, value]) => [name, Math.min(value, globalMaxBytes)])
      )
    )
  });
}

export function validateHttpBodyConfiguration() {
  return getHttpBodyConfiguration();
}

export class HttpRequestError extends Error {
  constructor(message, statusCode, { closeConnection = false } = {}) {
    super(message);
    this.name = "HttpRequestError";
    this.statusCode = statusCode;
    this.closeConnection = closeConnection;
  }
}

export function sendJson(response, statusCode, payload, headers = {}) {
  if (response.headersSent || response.writableEnded) {
    return false;
  }
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers
  });
  response.end(JSON.stringify(payload, null, 2));
  return true;
}

export function sendEmpty(response, statusCode = 204) {
  if (response.headersSent || response.writableEnded) {
    return false;
  }
  response.writeHead(statusCode);
  response.end();
  return true;
}

function parseContentLength(request) {
  const raw = request.headers?.["content-length"];
  if (raw === undefined) {
    return null;
  }
  const normalized = String(raw).trim();
  if (!/^(0|[1-9][0-9]*)$/.test(normalized)) {
    throw new HttpRequestError("Content-Length no es valido.", 400, { closeConnection: true });
  }
  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed)) {
    throw new HttpRequestError("Content-Length no es valido.", 400, { closeConnection: true });
  }
  return parsed;
}

export function readRequestBody(request, { kind = "json" } = {}) {
  const config = getHttpBodyConfiguration();
  const maxBytes = config.limits[kind] ?? config.globalMaxBytes;
  let contentLength;
  try {
    contentLength = parseContentLength(request);
  } catch (error) {
    return Promise.reject(error);
  }
  if (contentLength !== null && contentLength > maxBytes) {
    request.resume?.();
    return Promise.reject(
      new HttpRequestError(`El cuerpo excede el limite permitido de ${maxBytes} bytes.`, 413, {
        closeConnection: true
      })
    );
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    let receivedBytes = 0;
    let settled = false;
    const timer = setTimeout(() => {
      finish(
        new HttpRequestError("Se agoto el tiempo para recibir el cuerpo de la solicitud.", 408, {
          closeConnection: true
        })
      );
      request.resume?.();
    }, config.timeoutMs);
    timer.unref?.();

    function cleanup() {
      clearTimeout(timer);
      request.removeListener("data", onData);
      request.removeListener("end", onEnd);
      request.removeListener("aborted", onAborted);
      request.removeListener("error", onError);
      request.removeListener("close", onClose);
    }

    function finish(error, value) {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      if (error) {
        reject(error);
      } else {
        resolve(value);
      }
    }

    function onData(chunk) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      receivedBytes += buffer.length;
      if (receivedBytes > maxBytes) {
        finish(
          new HttpRequestError(`El cuerpo excede el limite permitido de ${maxBytes} bytes.`, 413, {
            closeConnection: true
          })
        );
        request.resume?.();
        return;
      }
      chunks.push(buffer);
    }

    function onEnd() {
      if (contentLength !== null && receivedBytes !== contentLength) {
        finish(new HttpRequestError("El cuerpo recibido esta incompleto.", 400, { closeConnection: true }));
        return;
      }
      finish(null, Buffer.concat(chunks, receivedBytes));
    }

    function onAborted() {
      finish(new HttpRequestError("La solicitud fue interrumpida antes de completarse.", 400));
    }

    function onError() {
      finish(new HttpRequestError("No fue posible leer el cuerpo de la solicitud.", 400));
    }

    function onClose() {
      if (!request.complete) {
        finish(new HttpRequestError("La solicitud se cerro antes de completar el cuerpo.", 400));
      }
    }

    request.on("data", onData);
    request.once("end", onEnd);
    request.once("aborted", onAborted);
    request.once("error", onError);
    request.once("close", onClose);
  });
}

export async function readJsonBody(request, options = {}) {
  const body = await readRequestBody(request, { kind: "json", ...options });
  if (!body.length) {
    return {};
  }
  try {
    return JSON.parse(body.toString("utf-8"));
  } catch {
    throw new HttpRequestError("El JSON enviado no es valido.", 400);
  }
}
