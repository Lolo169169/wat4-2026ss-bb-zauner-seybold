/** Jest-Konfiguration für die eigens erstellte Unit-/Integrations-Suite.
 *  Läuft bewusst getrennt von der bestehenden Vitest-Suite (frontend/backend-helper).
 */
module.exports = {
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.js"],
  setupFiles: ["<rootDir>/tests/helpers/loadEnv.js"],
  collectCoverageFrom: [
    "backend/controllers/**/*.js",
    "backend/middleware/**/*.js",
    "backend/helper/**/*.js",
    "backend/models/**/*.js",
    "backend/routes/**/*.js",
    "!backend/**/*.test.js",
  ],
  coverageDirectory: "<rootDir>/coverage/jest",
  // Integrationstests teilen sich eine DB -> seriell ausführen für saubere Isolation.
  testTimeout: 30000,
  verbose: true,
};
