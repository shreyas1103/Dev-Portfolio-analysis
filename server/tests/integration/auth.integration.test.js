const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../../src/app");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
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

describe("Authentication integration", () => {
  const user = {
    name: "Test User",
    email: "test@example.com",
    password: "Test@12345",
  };

  test("registers a new user", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(user);

    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.email).toBe(user.email);
  });

  test("logs in and returns an access token", async () => {
    await request(app)
      .post("/api/auth/register")
      .send(user);

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: user.email,
        password: user.password,
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.user.email).toBe(user.email);

    expect(response.headers["set-cookie"]).toBeDefined();
  });

  test("accesses /auth/me with a valid access token", async () => {
    await request(app)
      .post("/api/auth/register")
      .send(user);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: user.email,
        password: user.password,
      });

    const accessToken =
      loginResponse.body.data.accessToken;

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(user.email);
    expect(response.body.data.name).toBe(user.name);
  });

  test("rejects /auth/me without an access token", async () => {
    const response = await request(app)
      .get("/api/auth/me");

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});