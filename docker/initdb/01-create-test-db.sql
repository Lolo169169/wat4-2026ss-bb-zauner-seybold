-- Wird beim ersten Start des Postgres-Containers automatisch ausgeführt.
-- Die Entwicklungs-DB (database_development) wird bereits über POSTGRES_DB angelegt;
-- hier ergänzen wir die isolierte Test-Datenbank.
CREATE DATABASE database_testing;
