import { test, expect } from "@playwright/test";

test.describe("PrimmSection tests", () => {
  test("Test can run the PRIMM section up to requiring AI", async ({
    page,
  }) => {
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
});
