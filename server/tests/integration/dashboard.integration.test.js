const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../../src/app");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Dashboard integration", () => {
  const user = {
    name: "Dashboard Test User",
    email: "dashboard@example.com",
    password: "Test@12345",
  };

  async function getAccessToken() {
    await request(app)
      .post("/api/auth/register")
      .send(user);

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: user.email,
        password: user.password,
      });

    return response.body.data.accessToken;
  }

  test("returns empty dashboard state when user has no connected accounts", async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    const data = response.body.data;

    expect(data.consistencyScore).toBe(0);
    expect(data.currentStreak).toBe(0);
    expect(data.longestStreak).toBe(0);
    expect(data.trend).toBe("stable");
    expect(data.explanation).toBe("");
    expect(data.overallQualityScore).toBe(0);
    expect(data.reposConsidered).toBe(0);
    expect(data.languageBreakdown).toEqual({});
    expect(data.syncStatuses).toEqual([]);
    expect(data.computedAt).toBeNull();
  });

  test("rejects dashboard request without authentication", async () => {
    const response = await request(app)
      .get("/api/dashboard");

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});