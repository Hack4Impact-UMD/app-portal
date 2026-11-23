import { ApplicationStatus, ReviewStatus } from "@app-portal/shared/constants";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import {
  createApplicant,
  ESSAY_PROMPT,
  FORM_ID,
  getResponsesFor,
  getStatusesFor,
  resetEmulators,
  seedActiveForm,
} from "../support/emulators";
import { logInAsApplicant } from "../support/pages";

test.beforeEach(async () => {
  await resetEmulators();
  await seedActiveForm();
});

const essayInput = (page: Page) =>
  page.getByRole("main").filter({ hasText: ESSAY_PROMPT }).getByRole("textbox");

async function savedEssay(userId: string) {
  const [response] = await getResponsesFor(userId);
  return response?.sectionResponses.find(
    (s: { sectionId: string }) => s.sectionId === "about",
  )?.questions[0].response;
}

async function startApplication(page: Page) {
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(new RegExp(`/apply/f/${FORM_ID}/roles$`));
  await page.getByRole("button", { name: /Engineer/ }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page).toHaveURL(new RegExp(`/apply/f/${FORM_ID}/about$`));
}

test("saves, edits and submits an application", async ({ page }) => {
  const applicant = await createApplicant("Avery");
  await logInAsApplicant(page, applicant.email);
  await startApplication(page);

  await essayInput(page).fill("I love building things.");
  await expect
    .poll(() => savedEssay(applicant.uid))
    .toBe("I love building things.");

  await page.reload();
  await expect(essayInput(page)).toHaveValue("I love building things.");

  await essayInput(page).fill("I want to build software for nonprofits.");
  await expect
    .poll(() => savedEssay(applicant.uid))
    .toBe("I want to build software for nonprofits.");
  const [draft] = await getResponsesFor(applicant.uid);
  expect(draft.status).toBe(ApplicationStatus.InProgress);
  expect(draft.rolesApplied).toEqual(["engineer"]);

  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page).toHaveURL(new RegExp(`/apply/submit/${FORM_ID}$`));
  await expect(
    page.getByRole("heading", { name: "Almost there!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page).toHaveURL(/\/apply\/success$/);
  const [submitted] = await getResponsesFor(applicant.uid);
  expect(submitted.status).toBe(ApplicationStatus.Submitted);
  const statuses = await getStatusesFor(submitted.id);
  expect(statuses).toHaveLength(1);
  expect(statuses[0]).toMatchObject({
    role: "engineer",
    status: ReviewStatus.UnderReview,
  });

  await page.goto("/apply");
  await expect(
    page.getByRole("button", { name: "Go to status page" }),
  ).toBeVisible();
});

test("shows the server's validation errors on submit", async ({ page }) => {
  const applicant = await createApplicant("Vale");
  await logInAsApplicant(page, applicant.email);
  await startApplication(page);

  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page).toHaveURL(new RegExp(`/apply/submit/${FORM_ID}$`));
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(
    page.getByText("Oops, looks like you've missed some things!"),
  ).toBeVisible();
  await expect(page.getByText("This question is required")).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/apply/submit/${FORM_ID}$`));

  const [response] = await getResponsesFor(applicant.uid);
  expect(response.status).toBe(ApplicationStatus.InProgress);
});

test("continues an in-progress application from the overview", async ({
  page,
}) => {
  const applicant = await createApplicant("Cora");
  await logInAsApplicant(page, applicant.email);
  await startApplication(page);
  await essayInput(page).fill("Half finished.");
  await expect.poll(() => savedEssay(applicant.uid)).toBe("Half finished.");

  await page.goto("/apply");
  await page.getByRole("button", { name: "Continue Application" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(essayInput(page)).toHaveValue("Half finished.");
});
