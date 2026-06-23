// Unit-Tests für die JWT-Authentifizierungs-Middleware.
// jwt-Helper und das User-Modell werden gemockt -> reiner Unit-Test ohne DB.
jest.mock("../../backend/helper/jwt", () => ({ jwtVerify: jest.fn() }));
jest.mock("../../backend/models", () => ({ User: { findOne: jest.fn() } }));

const { jwtVerify } = require("../../backend/helper/jwt");
const { User } = require("../../backend/models");
const { NotFoundError } = require("../../backend/helper/customErrors");
const verifyToken = require("../../backend/middleware/authentication");

describe("verifyToken middleware", () => {
  beforeEach(() => jest.clearAllMocks());

  it("passes through (no error) when no Authorization header is present", async () => {
    const req = { headers: {} };
    const next = jest.fn();

    await verifyToken(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // ohne Argument => kein Fehler
    expect(req.loggedUser).toBeUndefined();
    expect(jwtVerify).not.toHaveBeenCalled();
  });

  it("calls next with a SyntaxError when the token is missing/malformed", async () => {
    const req = { headers: { authorization: "Bearer" } }; // kein Token nach dem Split
    const next = jest.fn();

    await verifyToken(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const passedError = next.mock.calls[0][0];
    expect(passedError).toBeInstanceOf(SyntaxError);
    expect(passedError.message).toBe("Token missing or malformed");
  });

  it("attaches loggedUser and token for a valid token of an existing user", async () => {
    jwtVerify.mockResolvedValue({ username: "bob", email: "bob@example.com" });
    User.findOne.mockResolvedValue({ id: 1, dataValues: {} });

    const req = { headers: { authorization: "Token valid.jwt.here" } };
    const next = jest.fn();

    await verifyToken(req, {}, next);

    expect(User.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "bob@example.com" } }),
    );
    expect(req.loggedUser).toEqual({ id: 1, dataValues: { token: "valid.jwt.here" } });
    expect(req.headers.email).toBe("bob@example.com");
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("calls next with NotFoundError when the token's user does not exist", async () => {
    jwtVerify.mockResolvedValue({ username: "ghost", email: "ghost@example.com" });
    User.findOne.mockResolvedValue(null);

    const req = { headers: { authorization: "Token valid.jwt.here" } };
    const next = jest.fn();

    await verifyToken(req, {}, next);

    // Erste next()-Aufruf trägt den fachlich erwarteten NotFoundError.
    expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
    expect(next.mock.calls[0][0].message).toBe("User not found ");
  });
});
