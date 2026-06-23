// Unit-Tests für slugify() — ergänzt die bestehende (Upstream-)Vitest-Suite
// um Edge Cases (Sonderzeichen, Zahlen, Unicode), die dort nicht abgedeckt sind.
const { slugify } = require("../../backend/helper/helpers");

describe("slugify (additional edge cases)", () => {
  it("trims, lowercases and dashes a simple title", () => {
    expect(slugify("  My First Article  ")).toBe("my-first-article");
  });

  it("keeps digits and dashes alphanumeric words", () => {
    expect(slugify("Article 123 Draft")).toBe("article-123-draft");
  });

  it("replaces every non-word char and underscore with a dash", () => {
    // Dokumentiert das (bewusst naive) Verhalten: Mehrfach-Sonderzeichen
    // erzeugen Mehrfach-Dashes und ggf. einen Trailing-Dash.
    expect(slugify("Node.js & Express!")).toBe("node-js---express-");
  });

  it("turns non-ASCII letters into dashes (known limitation)", () => {
    expect(slugify("Über Café")).toBe("-ber-caf-");
  });
});
