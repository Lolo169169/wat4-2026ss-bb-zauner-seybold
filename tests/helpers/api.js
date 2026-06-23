// API-Helfer für Integrationstests: kapselt Supertest + wiederkehrende Flows
// (Registrierung, Login, Artikel anlegen) und das Auth-Header-Format ("Token <jwt>").
const request = require("supertest");
const app = require("../../backend/app");

const buildUser = (overrides = {}) => ({
  username: "alice",
  email: "alice@example.com",
  password: "password123",
  ...overrides,
});

const agent = () => request(app);

// Registriert einen User und gibt Response + Token zurück.
async function registerUser(overrides = {}) {
  const user = buildUser(overrides);
  const res = await request(app).post("/api/users").send({ user });
  return { res, token: res.body?.user?.token, user };
}

const authHeader = (token) => ({ Authorization: `Token ${token}` });

// Legt einen Artikel für den per Token identifizierten User an.
async function createArticle(token, overrides = {}) {
  const article = {
    title: "How to test",
    description: "A guide",
    body: "Lorem ipsum",
    tagList: [],
    ...overrides,
  };
  return request(app)
    .post("/api/articles")
    .set(authHeader(token))
    .send({ article });
}

module.exports = { app, agent, buildUser, registerUser, authHeader, createArticle };
