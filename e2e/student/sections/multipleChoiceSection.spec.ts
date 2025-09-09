import { test, expect } from "@playwright/test";

test.describe("MultipleChoiceSection tests", () => {
  test("Can get answer right with multiple choice", async ({ page }) => {
    await page.goto(
      "/thoughtful-python/lesson/xx_learning/01_learning_reflection"
    );
    await page.getByLabel("It forces you to retrieve").check();
    await page
      .locator("#reflection-quiz")
      .getByRole("button", { name: "Submit Answer" })
      .click();
    await expect(page.getByText("Correct! Re-organizing and")).toBeVisible();
  });

  test("Can get answer wrong with multiple choice", async ({ page }) => {
    await page.goto(
      "/thoughtful-python/lesson/xx_learning/01_learning_reflection"
    );
    await page
      .locator("div")
      .filter({
        hasText:
          /^It allows you to skip the parts of the code you don't understand\.$/,
      })
      .click();
    await page
      .locator("#reflection-quiz")
      .getByRole("button", { name: "Submit Answer" })
      .click();
    await expect(
      page.locator("#reflection-quiz").getByText("Oops! Time penalty active.")
    ).toBeVisible();
    await expect(page.getByText("Incorrect!")).toBeVisible();
  });
});
