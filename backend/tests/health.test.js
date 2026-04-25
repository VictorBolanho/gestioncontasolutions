const request = require("supertest");

const { app } = require("../src/app");

describe("Health endpoints", () => {
  test("GET /health returns basic health payload", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("ContaSolutions API is healthy");
  });

  test("GET /health/details returns detailed health payload", async () => {
    const response = await request(app).get("/health/details");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("database");
    expect(response.body.data).toHaveProperty("uptime");
    expect(response.body.data).toHaveProperty("memory");
    expect(response.body.data).toHaveProperty("version");
  });
});
