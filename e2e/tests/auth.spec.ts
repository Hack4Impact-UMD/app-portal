import { PermissionRole } from "@app-portal/shared/constants";
import { expect, test } from "@playwright/test";

import {
  createApplicant,
  getUserByEmail,
  getVerificationLink,
  PASSWORD,
  resetEmulators,
  seedActiveForm,
  uniqueEmail,
} from "../support/emulators";
import { logIn, logInAsApplicant } from "../support/pages";

test.beforeEach(async () => {
  await resetEmulators();
  await seedActiveForm();
});

test("signs up, verifies the email, then logs in and out", async ({
  page,
  request,
}) => {
  const email = uniqueEmail("signup");

  await page.goto("/signup");
  await page.getByLabel("FIRST NAME").fill("Sam");
  await page.getByLabel("LAST NAME").fill("Signup");
  await page.getByLabel(/^EMAIL/).fill(email);
  await page.getByLabel("PASSWORD").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/verify$/);
  await expect(
    page.getByRole("heading", { name: `Verify your ${email} email!` }),
  ).toBeVisible();
  await expect
    .poll(() => getUserByEmail(email))
    .toMatchObject({
      email,
      firstName: "Sam",
      lastName: "Signup",
      role: PermissionRole.Applicant,
    });

  await expect
    .poll(() => getVerificationLink(email).catch(() => null))
    .not.toBeNull();
  const verify = await request.get(await getVerificationLink(email));
  expect(verify.ok()).toBe(true);

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page).not.toHaveURL(/\/verify$/);

  await logInAsApplicant(page, email);

  await page.getByRole("button", { name: "Sam" }).click();
  await page.getByRole("menuitem", { name: "Sign Out" }).click();
  await expect(page).not.toHaveURL(/\/apply/);

  await page.goto("/apply");
  await expect(page).toHaveURL(/\/login/);
});

test("sends unverified users to the verify page", async ({ page }) => {
  const email = uniqueEmail("unverified");
  await page.goto("/signup");
  await page.getByLabel("FIRST NAME").fill("Una");
  await page.getByLabel("LAST NAME").fill("Verified");
  await page.getByLabel(/^EMAIL/).fill(email);
  await page.getByLabel("PASSWORD").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/verify$/);

  await page.goto("/apply");
  await expect(page).toHaveURL(/\/verify$/);
});

test("rejects a wrong password", async ({ page }) => {
  const { email } = await createApplicant();

  await logIn(page, email, "Wrong-Password-1");

  await expect(
    page.getByText("Failed to login, check your email and password."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("rejects an email that's already registered", async ({ page }) => {
  const { email } = await createApplicant();

  await page.goto("/signup");
  await page.getByLabel("FIRST NAME").fill("Dupe");
  await page.getByLabel("LAST NAME").fill("Account");
  await page.getByLabel(/^EMAIL/).fill(email);
  await page.getByLabel("PASSWORD").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText(/Failed to register/).first()).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
});
