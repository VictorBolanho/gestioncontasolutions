import assert from "node:assert/strict";
import test from "node:test";

process.env.NODE_ENV = "test";
process.env.ALLOW_DEMO_SEEDS = "false";

const { defaultFiscalCalendars } = await import("../apps/api/src/data/seed-data.js");
const { normalizeSeedCalendars, seedTechnicalData } = await import("../apps/api/src/db/seed.js");

const organization = {
  id: "org_seed_test",
  nombre: "Organizacion Seed Test",
  estado: "activa"
};

function createAtomicHarness({ failOnCollection = "" } = {}) {
  let state = new Map();
  let writeAttempts = 0;
  return {
    async transaction(callback) {
      const pending = new Map(state);
      const client = { pending };
      const result = await callback(client);
      state = pending;
      return result;
    },
    async saveCollection(client, collectionName, value) {
      writeAttempts += 1;
      client.pending.set(collectionName, structuredClone(value));
      if (collectionName === failOnCollection) {
        throw new Error(`fallo inducido en ${collectionName}`);
      }
    },
    async syncSecurity(client) {
      client.pending.set("security", true);
    },
    snapshot() {
      return structuredClone(Object.fromEntries(state));
    },
    get writeAttempts() {
      return writeAttempts;
    }
  };
}

test("los 536 calendarios originales reproducen la ausencia previa de organizacionId", () => {
  assert.equal(defaultFiscalCalendars.length, 536);
  assert.equal(defaultFiscalCalendars.filter((item) => !item.organizacionId).length, 536);
});

test("normaliza explicitamente los 536 calendarios sin cambiar identidades ni cantidad", () => {
  const normalized = normalizeSeedCalendars(defaultFiscalCalendars, organization.id);
  assert.equal(normalized.length, 536);
  assert.ok(normalized.every((item) => item.organizacionId === organization.id));
  assert.deepEqual(normalized.map((item) => item.id), defaultFiscalCalendars.map((item) => item.id));
  assert.ok(defaultFiscalCalendars.every((item) => item.organizacionId === undefined));
});

test("una organizacion ausente, multiple o divergente falla antes de cualquier escritura", async () => {
  for (const loadOrganization of [
    async () => { throw new Error("no existe una organizacion activa"); },
    async () => { throw new Error("existen varias organizaciones activas"); }
  ]) {
    const harness = createAtomicHarness();
    await assert.rejects(
      seedTechnicalData({
        transaction: harness.transaction,
        loadOrganization,
        saveCollection: harness.saveCollection,
        syncSecurity: harness.syncSecurity
      }),
      /organizacion/i
    );
    assert.equal(harness.writeAttempts, 0);
    assert.deepEqual(harness.snapshot(), {});
  }

  const harness = createAtomicHarness();
  await assert.rejects(
    seedTechnicalData({
      transaction: harness.transaction,
      loadOrganization: async () => organization,
      saveCollection: harness.saveCollection,
      syncSecurity: harness.syncSecurity,
      calendars: [{ ...defaultFiscalCalendars[0], organizacionId: "org_distinta" }]
    }),
    /organizacion distinta/i
  );
  assert.equal(harness.writeAttempts, 0);
  assert.deepEqual(harness.snapshot(), {});
});

test("un error durante la escritura revierte todas las colecciones", async () => {
  const harness = createAtomicHarness({ failOnCollection: "fiscalCalendars" });
  await assert.rejects(
    seedTechnicalData({
      transaction: harness.transaction,
      loadOrganization: async () => organization,
      saveCollection: harness.saveCollection,
      syncSecurity: harness.syncSecurity
    }),
    /fallo inducido/
  );
  assert.deepEqual(harness.snapshot(), {});
});

test("dos ejecuciones son idempotentes y conservan exactamente 536 calendarios", async () => {
  const harness = createAtomicHarness();
  const options = {
    transaction: harness.transaction,
    loadOrganization: async () => organization,
    saveCollection: harness.saveCollection,
    syncSecurity: harness.syncSecurity
  };
  const first = await seedTechnicalData(options);
  const second = await seedTechnicalData(options);
  assert.equal(first.fiscalCalendars, 536);
  assert.equal(second.fiscalCalendars, 536);
  assert.equal(harness.snapshot().fiscalCalendars.length, 536);
  assert.equal(new Set(harness.snapshot().fiscalCalendars.map((item) => item.id)).size, 536);
});
