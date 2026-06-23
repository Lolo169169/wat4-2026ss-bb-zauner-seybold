// Hilfsfunktionen für die E2E-Tests.
// Isolation: jeder Test erzeugt einen eindeutigen Benutzer (Zeitstempel + Zufall),
// dadurch sind die Browser-Flows voneinander unabhängig und über Läufe hinweg
// wiederholbar – ohne Datenkollisionen in der geteilten Test-DB.

function uniqueSuffix() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function uniqueUser() {
  const id = uniqueSuffix();
  return {
    username: `user_${id}`,
    email: `user_${id}@example.com`,
    password: "password123",
  };
}

// Registriert einen Benutzer über die UI (Sign-up-Formular).
async function registerViaUI(page, user) {
  await page.goto("/#/register");
  await page.getByPlaceholder("Your Name").fill(user.username);
  await page.getByPlaceholder("Email").fill(user.email);
  await page.getByPlaceholder("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign up" }).click();
}

module.exports = { uniqueSuffix, uniqueUser, registerViaUI };
