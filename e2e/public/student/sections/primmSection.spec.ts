import { test, expect } from "@playwright/test";

test.describe("PrimmSection tests with regular code", () => {
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
    await page
      .getByRole("button", { name: "Get AI Feedback", exact: true })
      .click();
    await expect(page.getByText("Authentication or")).toBeVisible();
  });
});

test.describe("PrimmSection tests with turtles", () => {
  test("Test can run the PRIMM turtle section up to requiring AI", async ({
    page,
  }) => {
    await page.goto(
      "/thoughtful-python/lesson/03_functions_advanced/01_func_turtles"
    );

    await expect(page.locator("#square-primm #defaultCanvas0")).toBeVisible();
    await page
      .getByRole("textbox", {
        name: "Look at the pattern of forward() and right() function calls. What shape do you",
      })
      .click();
    await page
      .getByRole("textbox", {
        name: "Look at the pattern of forward() and right() function calls. What shape do you",
      })
      .fill("It will make a square");
    await page
      .locator("#square-primm")
      .getByRole("button", { name: "Run Code" })
      .click();
    // Turtles take a while
    await page.waitForTimeout(2000);
    await expect(page.locator("#square-primm #defaultCanvas0")).toBeVisible();
    await page
      .getByRole("textbox", { name: "Your Reflection/Explanation:" })
      .click();
    await page
      .getByRole("textbox", { name: "Your Reflection/Explanation:" })
      .fill("I was right");
    await page
      .getByRole("button", { name: "Get AI Feedback", exact: true })
      .click();
    await expect(page.getByText("Authentication or")).toBeVisible();
  });
});
