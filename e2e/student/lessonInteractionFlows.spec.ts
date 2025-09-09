import { test, expect } from "@playwright/test";

test("Can get answer right with multiple selection", async ({ page }) => {
  await page.goto("/thoughtful-python/lesson/xx_learning/00_learning_primm");
  await page.getByLabel("Be specific in your prediction").check();
  await page
    .locator("div")
    .filter({ hasText: /^Be critical in your interpretation$/ })
    .click();
  await page.getByLabel("Be careful when reading the").check();
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByText("Correct! The more you open")).toBeVisible();
});

test("Can get answer wrong with multiple selection", async ({ page }) => {
  await page.goto("/thoughtful-python/lesson/xx_learning/00_learning_primm");
  await page.getByLabel("Be specific in your prediction").check();
  await page.getByLabel("Be verbose to let the AI know").check();
  await page
    .locator("div")
    .filter({ hasText: /^Be critical in your interpretation$/ })
    .click();
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByText("Incorrect!")).toBeVisible();
  await expect(page.getByText("Oops! Time penalty active.")).toBeVisible();
});

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

test("Test can run the PRIMM section up to requiring AI", async ({ page }) => {
  await page.goto("/thoughtful-python/lesson/xx_learning/00_learning_primm");
  await page
    .getByRole("textbox", { name: "What do you think the program" })
    .click();
  await page
    .getByRole("textbox", { name: "What do you think the program" })
    .fill("I think it will print out two lines: a greeting and a question");
  await page
    .locator("#print-primm")
    .getByRole("button", { name: "Run Code" })
    .click();
  await page
    .getByRole("textbox", { name: "Your Reflection/Explanation:" })
    .click();
  await page
    .getByRole("textbox", { name: "Your Reflection/Explanation:" })
    .fill("I was right");
  await page.getByRole("button", { name: "Get AI Feedback" }).click();
  await expect(page.getByText("Authentication or")).toBeVisible();
});
