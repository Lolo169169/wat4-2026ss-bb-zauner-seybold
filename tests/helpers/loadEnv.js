// Wird von Jest vor jeder Testdatei geladen (setupFiles).
// Erzwingt die Test-Umgebung und lädt die lokale backend/.env, falls vorhanden.
// In CI kommen die DB-Variablen aus der Pipeline-Umgebung; dotenv überschreibt
// vorhandene Variablen nicht, daher ist beides konfliktfrei kombinierbar.
const path = require("path");

process.env.NODE_ENV = "test";

require("dotenv").config({
  path: path.join(__dirname, "..", "..", "backend", ".env"),
  quiet: true,
});
