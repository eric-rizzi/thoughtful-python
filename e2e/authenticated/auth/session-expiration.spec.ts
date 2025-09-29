// e2e/auth/session-expiration.spec.ts
import { test, expect } from "@playwright/test";

test("should show session expired modal on 401 API error", async ({ page }) => {
  // --- 1. Set up and Log in ---
  // Log in a user to establish a valid session first.
  // (Assuming you have a custom command or steps for logging in)
  await page.goto("/thoughtful-python/login");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();

  // --- 2. Intercept the API Call ---
  // Tell Playwright to intercept the next 'POST' request to your feedback endpoint.
  // When it catches it, it should respond with a 401 status.
  await page.route("**/api/feedback", (route) => {
    console.log("Intercepted feedback API call, returning 401.");
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unauthorized" }),
    });
  });

  // --- 3. Trigger the Authenticated Action ---
  // Now, perform the action that will make the intercepted API call.
  // For example, navigate to a lesson and submit feedback.
  await page.goto("/thoughtful-python/lesson/some-lesson");
  await page.getByPlaceholder("Share your feedback...").fill("This is a test");
  await page.getByRole("button", { name: "Submit" }).click();

  // --- 4. Assert the Modal Appears ---
  // The API interceptor in your app should now have triggered the state change.
  // Check that the session expired modal is visible.
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();
  await expect(modal.getByText("Your session has expired.")).toBeVisible();
  await expect(
    modal.getByText("Please log in again to continue.")
  ).toBeVisible();

  // --- 5. Assert that the User is Logged Out ---
  // Click the button in the modal to close it.
  await modal.getByRole("button", { name: "OK" }).click();

  // Verify that the user has been logged out and the modal is gone.
  await expect(modal).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Log out" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
});
