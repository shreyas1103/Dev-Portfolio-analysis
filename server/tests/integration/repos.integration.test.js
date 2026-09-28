const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../../src/app");
const Repo = require("../../src/models/Repo");

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

describe("Repos authorization boundary", () => {
  async function createUser(name, email) {
    await request(app)
      .post("/api/auth/register")
      .send({
        name,
        email,
        password: "Test@12345",
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Test@12345",
      });

    return response.body.data.accessToken;
  }

  test("user can only access their own repositories", async () => {
    const userAToken = await createUser(
      "User A",
      "usera@example.com"
    );

    const userBToken = await createUser(
      "User B",
      "userb@example.com"
    );

    const userAResponse = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${userAToken}`);

    const userBResponse = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${userBToken}`);

    const userAId = userAResponse.body.data.id;
    const userBId = userBResponse.body.data.id;

    await Repo.create([
      {
        userId: userAId,
        externalRepoId: "repo-a",
        name: "User A Repository",
        lastCommitAt: new Date(),
        qualityScore: 90,
      },
      {
        userId: userBId,
        externalRepoId: "repo-b",
        name: "User B Repository",
        lastCommitAt: new Date(),
        qualityScore: 80,
      },
    ]);

    const response = await request(app)
      .get("/api/repos")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    const repos = response.body.data.repos;

    expect(repos).toHaveLength(1);
    expect(repos[0].name).toBe("User A Repository");
    expect(repos[0].userId.toString()).toBe(userAId);

    expect(
      repos.some(
        (repo) => repo.name === "User B Repository"
      )
    ).toBe(false);
  });

  test("rejects repository request without authentication", async () => {
    const response = await request(app)
      .get("/api/repos");

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});