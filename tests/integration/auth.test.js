// Integrationstests: Registrierung, Login und der geschützte "current user"-Endpunkt.
// Echte Express-App + echte PostgreSQL-Test-DB (Supertest).
const request = require("supertest");
const { app, registerUser, authHeader } = require("../helpers/api");
const { syncDatabase, resetDatabase, closeDatabase } = require("../helpers/db");

let consoleSpy;

beforeAll(async () => {
  await syncDatabase();
  // errorHandler loggt erwartete Fehler sehr ausführlich -> im Test stummschalten.
  consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
});
beforeEach(async () => resetDatabase());
afterAll(async () => {
  consoleSpy.mockRestore();
  await closeDatabase();
});

describe("POST /api/users (register)", () => {
  it("creates a user, returns 201, a token and no password", async () => {
    const { res } = await registerUser();

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      username: "alice",
      email: "alice@example.com",
    });
    expect(typeof res.body.user.token).toBe("string");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("rejects registration without a password (422)", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ user: { username: "bob", email: "bob@example.com" } });

    expect(res.status).toBe(422);
    expect(res.body.errors.body[0]).toMatch(/password is required/i);
  });

  it("rejects a duplicate email (422)", async () => {
    await registerUser();
    const { res } = await registerUser({ username: "alice2" });

    expect(res.status).toBe(422);
    expect(res.body.errors.body[0]).toMatch(/already exists/i);
  });
});

describe("POST /api/users/login", () => {
  it("logs in with valid credentials and returns a token", async () => {
    await registerUser();

    const res = await request(app)
      .post("/api/users/login")
      .send({ user: { email: "alice@example.com", password: "password123" } });

    expect(res.status).toBe(200);
    expect(res.body.user.token).toBeDefined();
  });

  it("rejects a wrong password (422)", async () => {
    await registerUser();

    const res = await request(app)
      .post("/api/users/login")
      .send({ user: { email: "alice@example.com", password: "wrong" } });

    expect(res.status).toBe(422);
  });

  it("returns 404 for an unknown email", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ user: { email: "nobody@example.com", password: "x" } });

    expect(res.status).toBe(404);
  });
});

describe("GET /api/user (current user, protected)", () => {
  it("returns 401 without an Authorization header", async () => {
    const res = await request(app).get("/api/user");

    expect(res.status).toBe(401);
  });

  it("returns the current user when authenticated", async () => {
    const { token } = await registerUser();

    const res = await request(app).get("/api/user").set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("alice@example.com");
  });
});
