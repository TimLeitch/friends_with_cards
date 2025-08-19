const request = require("supertest");
const { app, server, io } = require("../backend/server");
const { pgPool, redisClient } = require("../backend/db/config");

// Close server and database connections after all tests
afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await new Promise((resolve) => io.close(resolve));
  await pgPool.end();
  await redisClient.quit();
});

describe("Server API", () => {
  test("GET /api should return welcome message", async () => {
    const response = await request(server).get("/api");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Friends with Cards API");
  });

  test("GET /health should return health status", async () => {
    const response = await request(server).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("OK");
    expect(response.body.timestamp).toBeDefined();
  });

  test("GET /nonexistent should return 404", async () => {
    const response = await request(server).get("/nonexistent");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Route not found");
  });
});
