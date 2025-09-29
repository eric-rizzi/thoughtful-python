import { test, expect } from "@playwright/test";

test.describe("MatchingSection tests @flaky", () => {
  // All matching sections tests get 5 retries
  test.describe.configure({ retries: 5 });

  test("Test can get a right answer from the MatchingSection", async ({
    page,
  }) => {
    await page.goto("/thoughtful-python/lesson/xx_learning/00_learning_primm");

    const predictBlock = page.getByText(
      "Force yourself to try and understand a program"
    );
    const runBlock = page.getByText(
      "Generate results to compare them with your expectations"
    );
    const interpretBlock = page.getByText(
      "Understand any mistakes in your mental model"
    );
    const modifyBlock = page.getByText(
      "Challenge yourself to expand on the existing ideas"
    );
    const makeBlock = page.getByText(
      "Challenge yourself to implement your own ideas"
    );

    const dropZone = () =>
      page.locator("div").filter({ hasText: /^Drop here$/ });

    await makeBlock.dragTo(dropZone().nth(4));
    await page.waitForTimeout(100);
    await modifyBlock.dragTo(dropZone().nth(3));
    await page.waitForTimeout(100);
    await interpretBlock.dragTo(dropZone().nth(2));
    await page.waitForTimeout(100);
    await runBlock.dragTo(dropZone().nth(1));
    await page.waitForTimeout(100);
    await predictBlock.dragTo(dropZone().nth(0));
    await page.waitForTimeout(100);

    await expect(page.getByText("Correct!")).toBeVisible();
  });

  test("Test can get a wrong answer from the MatchingSection", async ({
    page,
  }) => {
    await page.goto("/thoughtful-python/lesson/xx_learning/00_learning_primm");

    const predictBlock = page.getByText(
      "Force yourself to try and understand a program"
    );
    const runBlock = page.getByText(
      "Generate results to compare them with your expectations"
    );
    const interpretBlock = page.getByText(
      "Understand any mistakes in your mental model"
    );
    const modifyBlock = page.getByText(
      "Challenge yourself to expand on the existing ideas"
    );
    const makeBlock = page.getByText(
      "Challenge yourself to implement your own ideas"
    );

    const dropZone = () =>
      page.locator("div").filter({ hasText: /^Drop here$/ });

    await makeBlock.dragTo(dropZone().nth(4));
    await page.waitForTimeout(100);
    await modifyBlock.dragTo(dropZone().nth(3));
    await page.waitForTimeout(100);
    await interpretBlock.dragTo(dropZone().nth(2));
    await page.waitForTimeout(100);
    await predictBlock.dragTo(dropZone().nth(1));
    await page.waitForTimeout(100);
    await runBlock.dragTo(dropZone().nth(0));
    await page.waitForTimeout(100);

    await expect(
      page.getByText(
        "Not quite right. You can drag the answers to rearrange them."
      )
    ).toBeVisible();
  });
});
