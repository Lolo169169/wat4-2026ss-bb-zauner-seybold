// E2E: Authentifizierungs-Flows im Browser (Registrierung, Login, Fehlerfall, Logout).
const { test, expect } = require("@playwright/test");
const { uniqueUser, registerViaUI } = require("./helpers");

test("a visitor can register and ends up logged in", async ({ page }) => {
  const user = uniqueUser();

  await registerViaUI(page, user);

  // Nach erfolgreicher Registrierung erscheint die eingeloggte Navigation.
  await expect(page.getByRole("link", { name: /New Article/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign up" })).toHaveCount(0);
});

test("a registered user can log in via the login form", async ({ page, request }) => {
  const user = uniqueUser();
  // Benutzer vorab über die API anlegen (Seed), Login dann über die UI testen.
  const seed = await request.post("http://localhost:3001/api/users", {
    data: { user },
  });
  expect(seed.ok()).toBeTruthy();

  await page.goto("/#/login");
  await page.getByPlaceholder("Email").fill(user.email);
  await page.getByPlaceholder("Password").fill(user.password);
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByRole("link", { name: /New Article/ })).toBeVisible();
});

test("invalid login shows an error message", async ({ page }) => {
  await page.goto("/#/login");
  await page.getByPlaceholder("Email").fill("nobody@example.com");
  await page.getByPlaceholder("Password").fill("wrongpassword");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.locator(".error-messages")).toBeVisible();
  // Es darf keine eingeloggte Navigation erscheinen.
  await expect(page.getByRole("link", { name: /New Article/ })).toHaveCount(0);
});

test("a logged-in user can log out", async ({ page }) => {
  const user = uniqueUser();
  await registerViaUI(page, user);
  await expect(page.getByRole("link", { name: /New Article/ })).toBeVisible();

  // Dropdown öffnen und abmelden.
  await page.locator(".dropdown-toggle").click();
  await page.getByRole("link", { name: /Logout/ }).click();

  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("link", { name: /New Article/ })).toHaveCount(0);
});
