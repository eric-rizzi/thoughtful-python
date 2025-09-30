import { test, expect } from "@playwright/test";

test.describe("TestingSection `__main__` output tests", () => {
  test("Test that can click the `Run Code` button", async ({ page }) => {
    await page.goto("/thoughtful-python/lesson/00_intro/00_intro_strings");

    const sectionItem = page.getByRole("listitem").filter({
      hasText: "Challenge: Who Goes There?",
    });
    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);

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

    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);
  });

  test("Test that can click the `Run Tests` button (without actually doing anything) and get a failure", async ({
    page,
  }) => {
    await page.goto("/thoughtful-python/lesson/00_intro/00_intro_strings");

    const sectionItem = page.getByRole("listitem").filter({
      hasText: "Challenge: Who Goes There?",
    });
    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);

    await page
      .locator("div")
      .filter({ hasText: /^912›print\(\)print\(\)$/ })
      .nth(1)
      .click();
    await page
      .locator("#problem1-task-grammatical-greeting")
      .getByRole("button", { name: "Run Tests" })
      .click();
    await expect(
      page.getByText("Your solution passed 0 out of 1 tests.")
    ).toBeVisible();

    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);
  });

  test("Test that can click the `Run Tests` button and get a pass", async ({
    page,
  }) => {
    await page.goto("/thoughtful-python/lesson/00_intro/00_intro_strings");

    const sectionItem = page.getByRole("listitem").filter({
      hasText: "Challenge: Who Goes There?",
    });
    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);
    await page
      .locator("div")
      .filter({ hasText: /^912›print\(\)print\(\)$/ })
      .nth(1)
      .click();
    await page.getByText("print()print()").press("ControlOrMeta+a");
    await page
      .getByText("print()print()")
      .fill('print("Who\'s out there?")\nprint(\'I heard Eric say "me".\')');
    await page
      .locator("#problem1-task-grammatical-greeting")
      .getByRole("button", { name: "Run Tests" })
      .click();
    await expect(
      page.getByText("Your solution passed 1 out of 1 tests.")
    ).toBeVisible();

    await expect(sectionItem).toHaveClass(/sectionItemCompleted/);
  });

  test("Test that can click the `Run Tests` button and get a failure", async ({
    page,
  }) => {
    await page.goto("/thoughtful-python/lesson/00_intro/00_intro_strings");

    const sectionItem = page.getByRole("listitem").filter({
      hasText: "Challenge: Who Goes There?",
    });
    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);

    await page
      .locator("div")
      .filter({ hasText: /^912›print\(\)print\(\)$/ })
      .nth(1)
      .click();
    await page.getByText("print()print()").press("ControlOrMeta+a");
    await page
      .getByText("print()print()")
      .fill("print(\"Who's out there?\")\nprint(\"I heard Eric say 'me'.");
    await page
      .locator("#problem1-task-grammatical-greeting")
      .getByRole("button", { name: "Run Tests" })
      .click();
    await expect(
      page.getByText("Your solution passed 0 out of 1 tests.")
    ).toBeVisible();

    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);
  });
});

test.describe("TestingSection `return` tests", () => {
  test("Test that can click the `Run Tests` button and get a pass", async ({
    page,
  }) => {
    await page.goto("/thoughtful-python/lesson/02_functions/03_func_wrap_up");

    const sectionItem = page.getByRole("listitem").filter({
      hasText: "Challenge: Create a Two Input Function",
    });
    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);

    await page
      .locator("#multi-input-testing div")
      .filter({ hasText: "def do_math(num_1," })
      .nth(3)
      .click();
    await page
      .getByText("def do_math(num_1, num_2): #")
      .press("ControlOrMeta+a");
    await page
      .getByText("def do_math(num_1, num_2):")
      .fill(
        "def do_math(num_1, num_2):\n  return num_1 * num_2 + 1\n\n\ndo_math(2, 2)\ndo_math(4, 2)\ndo_math(4, 1)\ndo_math(6, 1)"
      );
    await page.getByRole("button", { name: "Run Tests" }).click();
    await expect(
      page.getByText("Your solution passed 4 out of 4 tests.")
    ).toBeVisible();

    await expect(sectionItem).toHaveClass(/sectionItemCompleted/);
  });
});

test.describe("TestingSection `return` tests", () => {
  test("Test that can click the `Run Tests` button and get a fail", async ({
    page,
  }) => {
    await page.goto("/thoughtful-python/lesson/02_functions/03_func_wrap_up");

    const sectionItem = page.getByRole("listitem").filter({
      hasText: "Challenge: Create a Two Input Function",
    });
    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);

    await page
      .locator("#multi-input-testing div")
      .filter({ hasText: "def do_math(num_1," })
      .nth(3)
      .click();
    await page
      .getByText("def do_math(num_1, num_2): #")
      .press("ControlOrMeta+a");
    await page
      .getByText("def do_math(num_1, num_2):")
      .fill(
        "def do_math(num_1, num_2):\n  return num_1 * num_2 - 1\n\n\ndo_math(2, 2)\ndo_math(4, 2)\ndo_math(4, 1)\ndo_math(6, 1)"
      );
    await page.getByRole("button", { name: "Run Tests" }).click();
    await expect(
      page.getByText("Your solution passed 0 out of 4 tests.")
    ).toBeVisible();

    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);
  });

  test("Test that can click the `Run Tests` button without doing anything and get a fail", async ({
    page,
  }) => {
    await page.goto("/thoughtful-python/lesson/02_functions/03_func_wrap_up");

    const sectionItem = page.getByRole("listitem").filter({
      hasText: "Challenge: Create a Two Input Function",
    });
    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);

    await page.getByRole("button", { name: "Run Tests" }).click();
    await expect(page.getByText("IndentationError")).toBeVisible();

    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);
  });
});
