const installations = new WeakMap();

export function getShutdownTimeoutMs(env = process.env) {
  const raw = String(env.HTTP_SHUTDOWN_TIMEOUT_MS || "").trim();
  if (!raw) {
    return 10000;
  }
  if (!/^[1-9][0-9]*$/.test(raw)) {
    throw new Error("HTTP_SHUTDOWN_TIMEOUT_MS debe ser un entero positivo.");
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 100 || value > 120000) {
    throw new Error("HTTP_SHUTDOWN_TIMEOUT_MS debe estar entre 100 y 120000.");
  }
  return value;
}

export function installGracefulShutdown({
  name,
  server,
  markNotReady = () => {},
  closeResources = async () => {},
  timeoutMs = getShutdownTimeoutMs(),
  environment = process.env.NODE_ENV,
  processRef = process,
  logger = console.error
}) {
  let processInstallations = installations.get(processRef);
  if (!processInstallations) {
    processInstallations = new Map();
    installations.set(processRef, processInstallations);
  }
  if (processInstallations.has(name)) {
    return processInstallations.get(name);
  }

  let shutdownPromise;
  const shutdown = (signal = "manual") => {
    if (shutdownPromise) {
      return shutdownPromise;
    }
    shutdownPromise = (async () => {
      markNotReady();
      let timedOut = false;
      const closed = new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      const idleCloser = setInterval(() => server.closeIdleConnections?.(), 25);
      idleCloser.unref?.();
      let timeoutHandle;
      const timeout = new Promise((resolve) => {
        timeoutHandle = setTimeout(() => {
          timedOut = true;
          resolve();
        }, timeoutMs);
        timeoutHandle.unref?.();
      });
      await Promise.race([closed, timeout]);
      clearTimeout(timeoutHandle);
      clearInterval(idleCloser);
      if (timedOut && environment !== "test") {
        server.closeAllConnections?.();
      }
      await closeResources();
      if (timedOut) {
        logger(JSON.stringify({ event: "graceful_shutdown_timeout", service: name, signal }));
      }
      return { timedOut };
    })();
    return shutdownPromise;
  };

  const handlers = new Map(
    ["SIGTERM", "SIGINT"].map((signal) => [
      signal,
      () => {
        shutdown(signal).catch(() => {
          processRef.exitCode = 1;
        });
      }
    ])
  );
  for (const [signal, handler] of handlers) {
    processRef.on(signal, handler);
  }

  const controller = Object.freeze({
    shutdown,
    uninstall() {
      for (const [signal, handler] of handlers) {
        processRef.off(signal, handler);
      }
      processInstallations.delete(name);
    }
  });
  processInstallations.set(name, controller);
  return controller;
}
