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

describe("Auth API", () => {
  let agent;

  beforeEach(() => {
    agent = request.agent(app);
  });

  const testUser = {
    username: `testuser_${Date.now()}`,
    password: "password123",
  };

  // Clean up the user created during the test
  afterEach(async () => {
    await pgPool.query("DELETE FROM users WHERE username = $1", [
      testUser.username,
    ]);
  });

  it("should register a new user", async () => {
    const res = await agent
      .post("/api/auth/register")
      .send(testUser)
      .expect(201);
    expect(res.body).toHaveProperty("userId");
  });

  it("should not register a user with a duplicate username", async () => {
    await agent.post("/api/auth/register").send(testUser).expect(201);
    const res = await agent
      .post("/api/auth/register")
      .send(testUser)
      .expect(409);
    expect(res.body.error).toBe("Username already taken");
  });

  it("should login a registered user", async () => {
    await agent.post("/api/auth/register").send(testUser);
    const res = await agent
      .post("/api/auth/login")
      .send({ username: testUser.username, password: testUser.password })
      .expect(200);
    expect(res.body).toHaveProperty("userId");
  });

  it("should log out a user", async () => {
    await agent.post("/api/auth/register").send(testUser).expect(201);
    await agent
      .post("/api/auth/login")
      .send({ username: testUser.username, password: testUser.password })
      .expect(200);
    await agent.post("/api/auth/logout").expect(200);
  });
});

describe("User API", () => {
  let agent;
  const testUser = {
    username: `testuser2_${Date.now()}`,
    password: "password123",
  };

  beforeAll(async () => {
    agent = request.agent(app);
    await agent.post("/api/auth/register").send(testUser).expect(201);
  });

  afterAll(async () => {
    await pgPool.query("DELETE FROM users WHERE username = $1", [
      testUser.username,
    ]);
  });

  it("should get the current user's data", async () => {
    const res = await agent.get("/api/user/me").expect(200);

    expect(res.body.user).toBeDefined();
    expect(res.body.settings).toBeDefined();
    expect(res.body.stats).toBeDefined();
    expect(res.body.user.username).toBe(testUser.username);
  });

  it("should update the user's settings", async () => {
    const newSettings = {
      theme: "dark",
      card_background: "blue",
    };
    const res = await agent
      .put("/api/user/settings")
      .send(newSettings)
      .expect(200);
    expect(res.body.theme).toBe("dark");
    expect(res.body.card_background).toBe("blue");
  });
});
