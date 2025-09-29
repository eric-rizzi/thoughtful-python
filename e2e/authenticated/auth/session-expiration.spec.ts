import { test, expect } from "@playwright/test";

test("should show session expired modal on a 401 API error", async ({
  page,
}) => {
  // 1. Intercept the network request before navigating
  await page.route("**/api/feedback", (route) => {
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unauthorized" }),
    });
  });

  // 2. Go to a page that makes the call (no login needed)
  await page.goto("/lesson/some-lesson-with-feedback");

  // 3. Trigger the API call
  await page.getByPlaceholder("Share your feedback...").fill("This is a test");
  await page.getByRole("button", { name: "Submit" }).click();

  // 4. Assert that the modal is now visible
  await expect(page.getByText("Session Expired")).toBeVisible();
});
