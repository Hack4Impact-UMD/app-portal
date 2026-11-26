import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import { PASSWORD } from "./emulators";

export async function logIn(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("EMAIL").fill(email);
  await page.getByLabel("PASSWORD").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

export async function logInAsApplicant(page: Page, email: string) {
  await logIn(page, email);
  await expect(page).toHaveURL(/\/apply$/);
  await expect(
    page.getByRole("heading", { name: /New Member Application/ }),
  ).toBeVisible();
}
