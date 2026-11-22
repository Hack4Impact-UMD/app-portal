import { ReviewStatus } from "@app-portal/shared/constants";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import {
  createApplicant,
  resetEmulators,
  seedActiveForm,
  seedSubmittedApplication,
  setDecisionsReleased,
} from "../support/emulators";
import { logInAsApplicant } from "../support/pages";

test.beforeEach(async () => {
  await resetEmulators();
  await seedActiveForm();
});

const applicationRow = (page: Page) =>
  page.getByRole("row").filter({ hasText: "E2E Semester Application" });

test("shows an application that's under review", async ({ page }) => {
  const applicant = await createApplicant("Uma");
  await seedSubmittedApplication(applicant.uid, ReviewStatus.UnderReview);

  await logInAsApplicant(page, applicant.email);
  await page.getByRole("button", { name: "Go to status page" }).click();

  await expect(page).toHaveURL(/\/apply\/status$/);
  await expect(applicationRow(page)).toContainText("Under Review");
  await expect(applicationRow(page)).toContainText("-");
});

test("shows an interview invitation before decisions are released", async ({
  page,
}) => {
  const applicant = await createApplicant("Ian");
  await seedSubmittedApplication(applicant.uid, ReviewStatus.Interview);

  await logInAsApplicant(page, applicant.email);
  await page.goto("/apply/status");

  await expect(applicationRow(page)).toContainText("Interview");
});

test("hides the decision until decisions are released", async ({ page }) => {
  const applicant = await createApplicant("Dana");
  await seedSubmittedApplication(applicant.uid, ReviewStatus.Accepted);

  await logInAsApplicant(page, applicant.email);
  await page.goto("/apply/status");

  await expect(applicationRow(page)).toContainText("Decided");
  await expect(applicationRow(page)).toContainText("Decisions not Released");
  await expect(page.getByRole("link", { name: "View Decision" })).toHaveCount(
    0,
  );

  await setDecisionsReleased(true);
  await page.reload();

  await expect(applicationRow(page)).toContainText("Decided");
  await expect(page.getByRole("link", { name: "View Decision" })).toBeVisible();
});
