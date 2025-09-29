import { test, expect } from "@playwright/test";

test.describe("ObservationSection tests", () => {
  test("Test can click the `Run Code` button", async ({ page }) => {
    await page.goto("/thoughtful-python/lesson/xx_learning/00_learning_primm");
    await page
      .locator("#running-code")
      .getByRole("button", { name: "Run Code" })
      .click();
    await expect(page.getByText("Hello, World! Can I call")).toBeVisible();
  });
});
