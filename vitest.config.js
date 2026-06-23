import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "frontend/src/setupTests.js",
    css: true,
    // Vitest betreibt nur die bestehende (Upstream-)Suite. Unsere eigene
    // Jest-/Playwright-/k6-Suite liegt unter tests|e2e|load und wird ausgeschlossen.
    include: [
      "frontend/src/**/*.test.{js,jsx}",
      "backend/helper/**/*.test.js",
    ],
    exclude: ["**/node_modules/**", "tests/**", "e2e/**", "load/**"],
  },
});
