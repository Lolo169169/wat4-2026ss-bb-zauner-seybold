// Integrationstests für die Artikel-Endpunkte (CRUD + Auth + Validierung).
const request = require("supertest");
const { app, registerUser, authHeader, createArticle } = require("../helpers/api");
const { syncDatabase, resetDatabase, closeDatabase } = require("../helpers/db");

let consoleSpy;

beforeAll(async () => {
  await syncDatabase();
  consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
});
beforeEach(async () => resetDatabase());
afterAll(async () => {
  consoleSpy.mockRestore();
  await closeDatabase();
});

describe("POST /api/articles (create)", () => {
  it("requires authentication (401)", async () => {
    const res = await request(app)
      .post("/api/articles")
      .send({ article: { title: "x", description: "y", body: "z", tagList: [] } });

    expect(res.status).toBe(401);
  });

  it("creates an article and derives a slug from the title (201)", async () => {
    const { token } = await registerUser();

    const res = await createArticle(token, { title: "How To Test" });

    expect(res.status).toBe(201);
    expect(res.body.article.slug).toBe("how-to-test");
    expect(res.body.article.author.username).toBe("alice");
  });

  it("rejects a duplicate title/slug (422)", async () => {
    const { token } = await registerUser();
    await createArticle(token, { title: "Unique Title" });

    const res = await createArticle(token, { title: "Unique Title" });

    expect(res.status).toBe(422);
    expect(res.body.errors.body[0]).toMatch(/already exists/i);
  });

  it("rejects a missing title (422)", async () => {
    const { token } = await registerUser();

    const res = await request(app)
      .post("/api/articles")
      .set(authHeader(token))
      .send({ article: { description: "d", body: "b", tagList: [] } });

    expect(res.status).toBe(422);
    expect(res.body.errors.body[0]).toMatch(/title/i);
  });
});

describe("GET /api/articles", () => {
  it("round-trips: a created article is retrievable by slug", async () => {
    const { token } = await registerUser();
    await createArticle(token, { title: "Round Trip" });

    const res = await request(app)
      .get("/api/articles/round-trip")
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.article.title).toBe("Round Trip");
  });

  it("returns 404 for an unknown slug", async () => {
    const { token } = await registerUser();

    const res = await request(app)
      .get("/api/articles/does-not-exist")
      .set(authHeader(token));

    expect(res.status).toBe(404);
  });

  it("lists articles with a total count", async () => {
    const { token } = await registerUser();
    await createArticle(token, { title: "First Post" });

    const res = await request(app).get("/api/articles").set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles).toHaveLength(1);
  });
});
