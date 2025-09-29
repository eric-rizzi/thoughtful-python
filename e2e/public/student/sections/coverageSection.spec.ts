import { test, expect } from "@playwright/test";

test.describe("ObservationSection tests", () => {
  test("Test get complete if all coverage inputs are right", async ({
    page,
  }) => {
    await page.goto("/thoughtful-python/lesson/02_functions/03_func_wrap_up");
    await page
      .getByRole("row", { name: "12 Run" })
      .getByRole("spinbutton")
      .click();
    await page
      .getByRole("row", { name: "12 Run" })
      .getByRole("spinbutton")
      .fill("3");
    await page.getByRole("row", { name: "12 Run" }).getByRole("button").click();
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
      .getByRole("row", { name: "28 Run" })
      .getByRole("spinbutton")
      .click();
    await page
      .getByRole("row", { name: "28 Run" })
      .getByRole("spinbutton")
      .fill("7");
    await page.getByRole("row", { name: "28 Run" }).getByRole("button").click();
    await expect(page.getByText("3 / 3 challenges completed")).toBeVisible();
  });

  test("Test get 2/3 if coverage are mostly right", async ({ page }) => {
    await page.goto("/thoughtful-python/lesson/02_functions/03_func_wrap_up");
    await page
      .getByRole("row", { name: "12 Run" })
      .getByRole("spinbutton")
      .click();
    await page
      .getByRole("row", { name: "12 Run" })
      .getByRole("spinbutton")
      .fill("3");
    await page.getByRole("row", { name: "12 Run" }).getByRole("button").click();
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
      .getByRole("row", { name: "28 Run" })
      .getByRole("spinbutton")
      .click();
    await page
      .getByRole("row", { name: "28 Run" })
      .getByRole("spinbutton")
      .fill("7");
    await page.getByRole("row", { name: "28 Run" }).getByRole("button").click();
    await expect(page.getByText("2 / 3 challenges completed")).toBeVisible();
  });
});
