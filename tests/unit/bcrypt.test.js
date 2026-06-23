// Unit-Tests für den Passwort-Hashing-Helper (echte bcrypt-Bibliothek, keine Mocks).
// Sicherheitsrelevant: Hashes dürfen nicht dem Klartext entsprechen, müssen gesalzen
// sein und korrekt verifizierbar bleiben.
const { bcryptHash, bcryptCompare } = require("../../backend/helper/bcrypt");

describe("bcrypt helper", () => {
  const password = "S3cr3t-Passw0rd!";

  it("hashes a password into a non-plaintext bcrypt string", async () => {
    const hash = await bcryptHash(password);

    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/); // bcrypt-Format mit Cost-Faktor
  });

  it("verifies a correct password against its hash", async () => {
    const hash = await bcryptHash(password);

    await expect(bcryptCompare(password, hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await bcryptHash(password);

    await expect(bcryptCompare("wrong-password", hash)).resolves.toBe(false);
  });

  it("produces a different (salted) hash for the same password each time", async () => {
    const hashA = await bcryptHash(password);
    const hashB = await bcryptHash(password);

    expect(hashA).not.toBe(hashB);
    // Beide müssen trotz unterschiedlichem Salt weiterhin verifizieren.
    await expect(bcryptCompare(password, hashA)).resolves.toBe(true);
    await expect(bcryptCompare(password, hashB)).resolves.toBe(true);
  });
});
