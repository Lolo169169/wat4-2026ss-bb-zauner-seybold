// Zentrale DB-Helfer für die Integrationstests.
// Sorgen für Test-Isolation: frisches Schema pro Datei (sync force),
// Leeren aller Tabellen pro Test (truncate cascade) und sauberes Schließen.
process.env.NODE_ENV = "test";

const db = require("../../backend/models");

// Baut das Schema komplett neu auf (dropt vorhandene Tabellen).
async function syncDatabase() {
  await db.sequelize.sync({ force: true });
}

// Leert alle Tabellen inkl. Verknüpfungstabellen und setzt IDs zurück.
async function resetDatabase() {
  await db.sequelize.truncate({ cascade: true, restartIdentity: true });
}

// Schließt den Connection-Pool (verhindert offene Handles am Testende).
async function closeDatabase() {
  await db.sequelize.close();
}

module.exports = { db, syncDatabase, resetDatabase, closeDatabase };
