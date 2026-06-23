// E2E: Artikel-Erstellung end-to-end durch den authentifizierten Nutzer.
const { test, expect } = require("@playwright/test");
const { uniqueUser, uniqueSuffix, registerViaUI } = require("./helpers");

test("a logged-in user can publish an article and view it", async ({ page }) => {
  const user = uniqueUser();
  await registerViaUI(page, user);
  await expect(page.getByRole("link", { name: /New Article/ })).toBeVisible();

  const title = `E2E Article ${uniqueSuffix()}`;

  // Zum Editor navigieren.
  await page.getByRole("link", { name: /New Article/ }).click();

  await page.getByPlaceholder("Article Title").fill(title);
  await page.getByPlaceholder("What's this article about?").fill("An E2E test article");
  await page
    .getByPlaceholder("Write your article (in markdown)")
    .fill("This is the **body** written by Playwright.");

  await page.getByRole("button", { name: /Publish Article/ }).click();

  // Nach dem Veröffentlichen landet man auf der Artikel-Detailseite.
  await expect(page).toHaveURL(/#\/article\//);
  await expect(page.locator("h1")).toContainText(title);
  await expect(page.getByText("body", { exact: false })).toBeVisible();
});
