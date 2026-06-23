---
name: progress-status
description: Aktueller Fortschritt der Test-Projektarbeit (welche Schritte fertig sind)
metadata:
  type: project
---

Fortschritt (siehe [[project-overview]], [[test-stack-decisions]]):

- **Schritt 1–6 fertig.** Baseline-Coverage war 1.28 % (nur Helper getestet).
- **Unit (Jest): 30 Tests** in `tests/unit/` (bcrypt, jwt, slugify, customErrors, errorHandler, authentication-middleware).
- **Integration (Jest+Supertest): 19 Tests** in `tests/integration/` gegen echtes Postgres (auth, articles, comments-tags). DB-Isolation via `tests/helpers/db.js` (sync force + truncate cascade pro Test). App-Refactor: `backend/app.js` exportiert Express-App ohne listen.
- **E2E (Playwright): 5 Tests** in `e2e/` (register, login, invalid login, logout, publish article). `playwright.config.js` startet Backend(NODE_ENV=test)+Frontend automatisch. Isolation via eindeutige User pro Test.
- **Load (k6): 2 Tests** in `load/` — `articles-load.js` (Load GET /api/articles: p95 238ms, 0% Fehler, max 20 VUs) und `auth-stress.js` (Spike POST /login: p95 1228ms bei 100 VUs, 0% Fehler — bcrypt-CPU-Engpass). Auswertung `load/analyze.js` erzeugt SVG-Charts (`load/charts/`) + `load/results/summary.md`. k6 = `C:\Program Files\k6\k6.exe` (winget GrafanaLabs.k6).
- **config.js-Fix:** logging-Env wird zu Boolean/Funktion gewandelt.

**Offen: Schritt 7 (CI/CD GitHub Actions), Schritt 8 (REPORT.md), Schritt 9 (PRESENTATION.pptx).**

Befehle: `npm run db:up`, `test:unit`, `test:integration`, `test:jest(:coverage)`, `test:vitest`, `test:e2e`, `test:load`, `test:load:report`.
