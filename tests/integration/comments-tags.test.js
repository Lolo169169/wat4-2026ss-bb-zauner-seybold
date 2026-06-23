// Integrationstests für Kommentare, den Tags-Endpunkt und den 404-Fallback.
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

describe("Comments", () => {
  it("creates a comment on an article (201) and lists it", async () => {
    const { token } = await registerUser();
    await createArticle(token, { title: "Commentable" });

    const created = await request(app)
      .post("/api/articles/commentable/comments")
      .set(authHeader(token))
      .send({ comment: { body: "Great article!" } });

    expect(created.status).toBe(201);
    expect(created.body.comment.body).toBe("Great article!");

    const list = await request(app)
      .get("/api/articles/commentable/comments")
      .set(authHeader(token));

    expect(list.status).toBe(200);
    expect(list.body.comments).toHaveLength(1);
    expect(list.body.comments[0].body).toBe("Great article!");
  });

  it("rejects a comment without a body (422)", async () => {
    const { token } = await registerUser();
    await createArticle(token, { title: "No Body Comment" });

    const res = await request(app)
      .post("/api/articles/no-body-comment/comments")
      .set(authHeader(token))
      .send({ comment: {} });

    expect(res.status).toBe(422);
  });
});

describe("GET /api/tags", () => {
  it("returns tags created together with an article", async () => {
    const { token } = await registerUser();
    await createArticle(token, {
      title: "Tagged Article",
      tagList: ["testing", "jest"],
    });

    const res = await request(app).get("/api/tags");

    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual(expect.arrayContaining(["testing", "jest"]));
  });
});

describe("Unknown routes", () => {
  it("returns a 404 JSON body for unmatched paths", async () => {
    const res = await request(app).get("/api/this/does/not/exist");

    expect(res.status).toBe(404);
    expect(res.body.errors.body).toContain("Not found");
  });
});
