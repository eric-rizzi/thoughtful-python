import { test, expect } from "@playwright/test";

test.describe("ObservationSection tests", () => {
  test("Test can click the `Run Code` button for regular code", async ({
    page,
  }) => {
    await page.goto("/thoughtful-python/lesson/xx_learning/00_learning_primm");

    const sectionItem = page
      .getByRole("listitem")
      .filter({ hasText: "Running Code" });
    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);

    await page
      .locator("#running-code")
      .getByRole("button", { name: "Run Code" })
      .click();
    await expect(page.getByText("Hello, World! Can I call")).toBeVisible();

    await expect(sectionItem).toHaveClass(/sectionItemCompleted/);
  });

  test("Test can click the `Run Code` button for Turtle", async ({ page }) => {
    await page.goto(
      "/thoughtful-python/lesson/03_functions_advanced/01_func_turtles"
    );

    const sectionItem = page
      .getByRole("listitem")
      .filter({ hasText: "Your First Turtle Program" });
    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);

    await page
      .locator("#first-turtle")
      .getByRole("button", { name: "Run Code" })
      .click();
    // Wait for animation to run
    await page.waitForTimeout(2000);
    await expect(
      page.locator("#first-turtle").getByRole("button", { name: "Run Code" })
    ).toBeVisible();

    await expect(sectionItem).toHaveClass(/sectionItemCompleted/);
  });

  test("Test can click the `Run Code` button for Turtle and catch error in turtle", async ({
    page,
  }) => {
    await page.goto(
      "/thoughtful-python/lesson/03_functions_advanced/01_func_turtles"
    );

    const sectionItem = page
      .getByRole("listitem")
      .filter({ hasText: "Your First Turtle Program" });
    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);

    await page.locator(".cm-content > div:nth-child(3)").first().click();
    await page
      .getByText(
        "import turtlet = turtle.Turtle()def make_T(): t.forward(100) t.right(90) t."
      )
      .fill("import turtle\nt = turtle.Turtle()\nt.righ()");
    await page
      .locator("#first-turtle")
      .getByRole("button", { name: "Run Code" })
      .click();
    await expect(page.getByText("has no attribute 'righ'")).toBeVisible();

    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);
  });

  test("Test can click the `Run Code` button for Turtle and catch SyntaxError", async ({
    page,
  }) => {
    await page.goto(
      "/thoughtful-python/lesson/03_functions_advanced/01_func_turtles"
    );

    const sectionItem = page
      .getByRole("listitem")
      .filter({ hasText: "Your First Turtle Program" });
    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);

    await page.locator("#first-turtle").getByText("import turtle").click();
    await page
      .getByText(
        "import turtlet = turtle.Turtle()def make_T(): t.forward(100) t.right(90) t."
      )
      .press("ControlOrMeta+a");
    await page
      .getByText(
        "import turtlet = turtle.Turtle()def make_T(): t.forward(100) t.right(90) t."
      )
      .fill("def h t");
    await page
      .locator("#first-turtle")
      .getByRole("button", { name: "Run Code" })
      .click();
    await expect(page.getByText("Execution Error: Traceback (")).toBeVisible();

    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);
  });
});
