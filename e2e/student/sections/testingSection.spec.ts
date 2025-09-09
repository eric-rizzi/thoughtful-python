import { test, expect } from "@playwright/test";

test.describe("TestingSection tests", () => {
  test("Test that can click the `Run Code` button for __main__ output tests", async ({
    page,
  }) => {
    await page.goto("/thoughtful-python/lesson/00_intro/00_intro_strings");
    await page
      .locator("div")
      .filter({ hasText: /^912›print\(\)print\(\)$/ })
      .nth(1)
      .click();
    await page.getByText("print()print()").press("ControlOrMeta+a");
    await page
      .getByText("print()print()")
      .fill('print("Who\'s out there?")\nprint(\'I heard Eric say "me".');
    await page
      .locator("#problem1-task-grammatical-greeting")
      .getByRole("button", { name: "Run Code" })
      .click();
    await expect(
      page
        .locator("#problem1-task-grammatical-greeting")
        .getByText('Who\'s out there?\nI heard Eric say "me".')
    ).toBeVisible();
  });
});
