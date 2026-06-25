/** Jest-Konfiguration für die eigens erstellte Unit-/Integrations-Suite.
 *  Läuft bewusst getrennt von der bestehenden Vitest-Suite (frontend/backend-helper).
 */
module.exports = {
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.js"],
  setupFiles: ["<rootDir>/tests/helpers/loadEnv.js"],
  // Fokus der Projektarbeit: der Authentifizierungs-/Login-Bereich.
  // Coverage wird daher nur über die auth-relevanten Module gemessen.
  collectCoverageFrom: [
    "backend/helper/bcrypt.js",
    "backend/helper/jwt.js",
    "backend/middleware/authentication.js",
    "backend/controllers/users.js",
    "backend/controllers/user.js",
    "backend/routes/users.js",
    "backend/routes/user.js",
    "backend/models/User.js",
    "!backend/**/*.test.js",
  ],
  coverageDirectory: "<rootDir>/coverage/jest",
  // Integrationstests teilen sich eine DB -> seriell ausführen für saubere Isolation.
  testTimeout: 30000,
  verbose: true,
};
