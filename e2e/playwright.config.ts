import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm --filter frontend exec vite --port 5173 --strictPort",
    cwd: "..",
    url: "http://localhost:5173",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_APPCHECK_DISABLED: "true",
      VITE_FIREBASE_API_KEY: "e2e-fake-api-key",
    },
  },
});
