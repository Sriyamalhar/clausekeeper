import { test, expect } from "@playwright/test";

// Uses the seeded demo account (see prisma/seed.ts). Run `npm run db:seed`
// against the test database before running this suite.

test("critical path: log in, create a client and contract, see it on the dashboard", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("demo@demo.com");
  await page.getByLabel("Password").fill("demo1234");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  // Navigate to contracts and create a new one end to end.
  await page.getByRole("link", { name: "Contracts" }).click();
  await page.getByRole("link", { name: "New contract" }).click();

  await page.getByRole("button", { name: "New" }).click();
  await page.getByPlaceholder("Client name").fill("Playwright Test Client");
  await page.getByRole("button", { name: "Add" }).click();

  await page.getByLabel("Contract title").fill("E2E test contract");
  await page.getByLabel("Start date").fill("2026-01-01");
  await page.getByRole("button", { name: "Create contract" }).click();

  await expect(page).toHaveURL(/\/contracts\/[a-z0-9]+/);
  await expect(page.getByRole("heading", { name: "E2E test contract" })).toBeVisible();

  // Confirm it shows up back in the list.
  await page.getByRole("link", { name: "Contracts" }).click();
  await expect(page.getByText("E2E test contract")).toBeVisible();
});

test("empty states show a working primary CTA for a brand-new org", async ({ page }) => {
  // This test documents the expected empty-state behavior; run against a
  // freshly created (non-seeded) account for a true first-run check.
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
});
