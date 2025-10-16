import { test, expect } from "@playwright/test";

test.describe("CoverageSection tests", () => {
  test("Test get complete if all coverage inputs are right", async ({
    page,
  }) => {
    await page.goto(
      "/thoughtful-python/lesson/03_functions/lessons/03_func_wrap_up"
    );

    const sectionItem = page.getByRole("listitem").filter({
      hasText: "Different Inputs",
    });
    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);

    await page
      .locator("#simple-coverage-single1")
      .getByRole("row", { name: "12 Run" })
      .getByRole("spinbutton")
      .click();
    await page
      .getByRole("row", { name: "12 Run" })
      .getByRole("spinbutton")
      .fill("3");
    await page
      .locator("#simple-coverage-single1")
      .getByRole("row", { name: "12 Run" })
      .getByRole("button")
      .click();
    await page
      .locator("#simple-coverage-single1")
      .getByRole("row", { name: "4 Run" })
      .getByRole("spinbutton")
      .click();
    await page
      .locator("#simple-coverage-single1")
      .getByRole("row", { name: "4 Run" })
      .getByRole("spinbutton")
      .fill("1");
    await page
      .locator("#simple-coverage-single1")
      .getByRole("row", { name: "4 Run" })
      .getByRole("button")
      .click();
    await page
      .locator("#simple-coverage-single1")
      .getByRole("row", { name: "28 Run" })
      .getByRole("spinbutton")
      .click();
    await page
      .locator("#simple-coverage-single1")
      .getByRole("row", { name: "28 Run" })
      .getByRole("spinbutton")
      .fill("7");
    await page
      .locator("#simple-coverage-single1")
      .getByRole("row", { name: "28 Run" })
      .getByRole("button")
      .click();
    await expect(page.getByText("3 / 3 challenges completed")).toBeVisible();

    await expect(sectionItem).toHaveClass(/sectionItemCompleted/);
  });

  test("Test get 2/3 if coverage are mostly right", async ({ page }) => {
    await page.goto(
      "/thoughtful-python/lesson/03_functions/lessons/03_func_wrap_up"
    );

    const sectionItem = page.getByRole("listitem").filter({
      hasText: "Different Inputs",
    });
    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);

    await page
      .locator("#simple-coverage-single1")
      .getByRole("row", { name: "12 Run" })
      .getByRole("spinbutton")
      .click();
    await page
      .locator("#simple-coverage-single1")
      .getByRole("row", { name: "12 Run" })
      .getByRole("spinbutton")
      .fill("3");
    await page
      .locator("#simple-coverage-single1")
      .getByRole("row", { name: "12 Run" })
      .getByRole("button")
      .click();
    await page
      .locator("#simple-coverage-single1")
      .getByRole("row", { name: "4 Run" })
      .getByRole("spinbutton")
      .click();
    // Intentional mistake
    await page
      .locator("#simple-coverage-single1")
      .getByRole("row", { name: "4 Run" })
      .getByRole("spinbutton")
      .fill("2");
    await page
      .locator("#simple-coverage-single1")
      .getByRole("row", { name: "4 Run" })
      .getByRole("button")
      .click();
    await page
      .locator("#simple-coverage-single1")
      .getByRole("row", { name: "28 Run" })
      .getByRole("spinbutton")
      .click();
    await page
      .locator("#simple-coverage-single1")
      .getByRole("row", { name: "28 Run" })
      .getByRole("spinbutton")
      .fill("7");
    await page
      .locator("#simple-coverage-single1")
      .getByRole("row", { name: "28 Run" })
      .getByRole("button")
      .click();
    await expect(page.getByText("2 / 3 challenges completed")).toBeVisible();

    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);
  });

  test("Test get full coverage for `return` statements", async ({ page }) => {
    await page.goto(
      "/thoughtful-python/lesson/10_functions_return/lessons/00_return_intro"
    );

    const sectionItem = page.getByRole("listitem").filter({
      hasText: "Make It Return That!",
    });
    await expect(sectionItem).not.toHaveClass(/sectionItemCompleted/);

    await page
      .locator("#age-coverage")
      .getByRole("row", { name: "You're a minor Run" })
      .getByRole("spinbutton")
      .click();
    await page
      .locator("#age-coverage")
      .getByRole("row", { name: "You're a minor Run" })
      .getByRole("spinbutton")
      .fill("3");
    await page
      .locator("#age-coverage")
      .getByRole("row", { name: "You're a minor Run" })
      .getByRole("button")
      .click();
    await page
      .locator("#age-coverage")
      .getByRole("row", { name: "You're an adult Run" })
      .getByRole("spinbutton")
      .click();
    await page
      .locator("#age-coverage")
      .getByRole("row", { name: "You're an adult Run" })
      .getByRole("spinbutton")
      .fill("19");
    await page
      .locator("#age-coverage")
      .getByRole("row", { name: "You're an adult Run" })
      .getByRole("button")
      .click();
    await expect(page.getByText("2 / 2 challenges completed")).toBeVisible();

    await expect(sectionItem).toHaveClass(/sectionItemCompleted/);
  });

  // This test requires a lesson with fixed inputs to be created
  // Update the path and selectors when the lesson is ready
  test.skip("Test fixed inputs are read-only and pre-filled", async ({ page }) => {
    // TODO: Replace with actual lesson path that has fixed inputs
    await page.goto(
      "/thoughtful-python/lesson/UNIT_ID/lessons/LESSON_WITH_FIXED_INPUTS"
    );

    // TODO: Replace with actual section ID
    const sectionLocator = page.locator("#coverage-with-fixed-inputs");

    // Test that fixed inputs are visible and have values
    const fixedInput = sectionLocator
      .getByRole("row")
      .first()
      .getByRole("spinbutton")
      .first();

    // Fixed inputs should be disabled
    await expect(fixedInput).toBeDisabled();

    // Fixed inputs should have the pre-filled value
    await expect(fixedInput).toHaveValue(/\d+/); // Some number value

    // Editable inputs (if any in same row) should not be disabled
    const editableInput = sectionLocator
      .getByRole("row")
      .first()
      .getByRole("spinbutton")
      .nth(1);

    if (await editableInput.count() > 0) {
      await expect(editableInput).not.toBeDisabled();
    }

    // User should be able to fill editable inputs and run the test
    await editableInput.fill("5");
    await sectionLocator
      .getByRole("row")
      .first()
      .getByRole("button", { name: "Run" })
      .click();

    // Should show results
    await expect(sectionLocator.getByText(/challenges completed/)).toBeVisible();
  });
});
