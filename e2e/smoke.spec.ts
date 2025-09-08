import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  // 1. Navigate to the base URL (e.g., your home page)
  await page.goto("/thoughtful-python/");

  // 2. Expect a title "to contain" a substring.
  // This is a great initial test to ensure the page loads correctly.
  await expect(page).toHaveTitle(/Thoughtful Python/);

  // 3. You can also locate elements and check their content.
  // Here, we find an h1 element that contains welcome text.
  const mainHeading = page.locator("#root h1");
  await expect(mainHeading).toContainText("Thoughtful Python");
});
