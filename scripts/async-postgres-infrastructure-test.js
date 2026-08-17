import assert from "node:assert/strict";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { EventEmitter } from "node:events";
import test from "node:test";
import { createPostgresClientManager } from "../apps/api/src/db/postgres-client.js";
import { createStorageProvider } from "../apps/api/src/lib/storage-provider.js";
import { installGracefulShutdown } from "../apps/api/src/lib/graceful-shutdown.js";

const config = {
  connectionString: "",
  host: "127.0.0.1",
  port: 5432,
  database: "test",
  user: "test",
  password: "",
  ssl: false,
  poolMax: 2,
  poolIdleMs: 1000,
  poolConnectionTimeoutMs: 1000,
  statementTimeoutMs: 1000,
  transactionTimeoutMs: 1000
};

class FakePool extends EventEmitter {
  static instances = [];

  constructor(options) {
    super();
    this.options = options;
    this.totalCount = 1;
    this.idleCount = 1;
    this.waitingCount = 0;
    this.endCalls = 0;
    this.queries = [];
    this.releaseCalls = 0;
    FakePool.instances.push(this);
  }

  async connect() {
    return {
      query: async (sql) => {
        this.queries.push(String(sql));
        if (String(sql) === "FAIL") {
          const error = new Error("detalle sensible");
          error.code = "23505";
          throw error;
        }
        return { rows: [{ "?column?": 1 }] };
      },
      release: () => {
        this.releaseCalls += 1;
      }
    };
  }

  async end() {
    this.endCalls += 1;
  }
}

test("pool lazy reutilizable, seguro ante concurrencia y cierre idempotente", async () => {
  FakePool.instances.length = 0;
  const manager = createPostgresClientManager({
    configProvider: () => config,
    PoolClass: FakePool,
    logger: () => {}
  });
  const pools = await Promise.all(Array.from({ length: 20 }, async () => manager.getPool()));
  assert.equal(new Set(pools).size, 1);
  assert.equal(FakePool.instances.length, 1);
  await Promise.all([manager.healthCheck(), manager.healthCheck()]);
  assert.equal(manager.metrics().total, 1);
  await Promise.all([manager.close(), manager.close()]);
  assert.equal(FakePool.instances[0].endCalls, 1);
  assert.throws(() => manager.getPool(), /cerrando|cerrado/);
});

test("transacciones confirman, revierten y siempre liberan el cliente", async () => {
  FakePool.instances.length = 0;
  const manager = createPostgresClientManager({
    configProvider: () => config,
    PoolClass: FakePool,
    logger: () => {}
  });
  assert.equal(await manager.withTransaction(async () => "ok"), "ok");
  await assert.rejects(
    manager.withTransaction(async (client) => client.query("FAIL")),
    (error) => error.code === "23505" && !error.message.includes("sensible")
  );
  const pool = FakePool.instances[0];
  assert.equal(pool.queries.filter((query) => query === "COMMIT").length, 1);
  assert.equal(pool.queries.filter((query) => query === "ROLLBACK").length, 1);
  assert.equal(pool.releaseCalls, 2);
  await manager.close();
});

test("proveedor JSON comprueba disponibilidad sin escribir datos", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gestorconta-provider-"));
  try {
    const provider = createStorageProvider({ driver: "json", dataDir: root });
    assert.deepEqual(await provider.readiness(), { ready: false });
    await provider.start();
    assert.deepEqual(await provider.readiness(), { ready: true });
    assert.deepEqual(await fs.readdir(root), []);
    await provider.close();
    assert.deepEqual(await provider.readiness(), { ready: false });
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("cierre HTTP espera una solicitud en vuelo y no duplica recursos", async () => {
  let releaseRequest;
  const server = http.createServer((_request, response) => {
    releaseRequest = () => response.end("ok");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const request = fetch(`http://127.0.0.1:${address.port}/slow`);
  while (!releaseRequest) {
    await new Promise((resolve) => setImmediate(resolve));
  }
  let ready = true;
  let closeCalls = 0;
  const processRef = new EventEmitter();
  processRef.exitCode = 0;
  const controller = installGracefulShutdown({
    name: "test",
    server,
    processRef,
    timeoutMs: 1000,
    markNotReady: () => {
      ready = false;
    },
    closeResources: async () => {
      closeCalls += 1;
    },
    logger: () => {}
  });
  const closing = controller.shutdown();
  assert.equal(ready, false);
  releaseRequest();
  assert.equal((await request).status, 200);
  assert.deepEqual(await closing, { timedOut: false });
  await controller.shutdown();
  assert.equal(closeCalls, 1);
  controller.uninstall();
});
