// Unit-Tests für den JWT-Helper (echte jsonwebtoken-Bibliothek).
// JWT_KEY wird vom Test-Setup (loadEnv) bereitgestellt.
const jwt = require("jsonwebtoken");
const { jwtSign, jwtVerify } = require("../../backend/helper/jwt");

describe("jwt helper", () => {
  const payload = {
    username: "alice",
    email: "alice@example.com",
    password: "should-not-be-in-token",
  };

  it("signs a payload into a three-part JWT string", async () => {
    const token = await jwtSign(payload);

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("only encodes username and email (no sensitive fields)", async () => {
    const token = await jwtSign(payload);
    const decoded = await jwtVerify(token);

    expect(decoded.username).toBe(payload.username);
    expect(decoded.email).toBe(payload.email);
    expect(decoded).not.toHaveProperty("password");
  });

  it("round-trips: a signed token verifies back to its payload", async () => {
    const token = await jwtSign(payload);

    await expect(jwtVerify(token)).resolves.toMatchObject({
      username: "alice",
      email: "alice@example.com",
    });
  });

  it("throws when verifying a tampered/invalid token", async () => {
    const token = await jwtSign(payload);
    const tampered = token.slice(0, -2) + "xx";

    await expect(jwtVerify(tampered)).rejects.toThrow(jwt.JsonWebTokenError);
  });
});
