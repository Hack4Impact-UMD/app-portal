import { z } from "zod";

import { GradingJobStatus } from "../constants/index.js";

export const TestResultSchema = z.object({
  suite: z.string().nonempty(),
  testName: z.string().nonempty(),
  passed: z.boolean(),
  pending: z.boolean(),
  stdout: z.string(),
  stderr: z.string(),
  errors: z.array(z.string()),
  durationMs: z.int(),
  points: z.int(),
});

export const SuiteResultSchema = z.object({
  suiteName: z.string().nonempty(),
  passed: z.int(),
  failed: z.int(),
  total: z.int(),
  durationMs: z.int(),
  points: z.int(),
  totalPoints: z.int(),
});

// ⚠️ should not be used on its own!!!!
// use the per-package extension schema with Timestamp!!!!
export const GradingJobPublicBaseSchema = z.object({
  id: z.string().nonempty(),
  responseId: z.string().nonempty(),
  repoURL: z.string().nonempty(),
  status: z.enum(GradingJobStatus),
  score: z.float64(),
  totalTests: z.int(),
  completedTests: z.int(),
  error: z.string().optional(),
  cloneDurationMs: z.int().optional(),
  installDurationMs: z.int().optional(),
  buildDurationMs: z.int().optional(),
  testingDurationMs: z.int().optional(),
  suiteResults: z.record(z.string(), SuiteResultSchema),
  publicTests: z.record(z.string(), z.record(z.string(), TestResultSchema)),
});

export const GradingJobDataInternalSchema = z.object({
  id: z.string().nonempty(),
  testRepo: z.string().nonempty(),
  buildLog: z.string(),
  installLog: z.string(),
  playwrightLog: z.string(),
  error: z.string().optional(),
  tests: z.record(z.string(), z.record(z.string(), TestResultSchema)),
});

export const submitGradingJobSchema = GradingJobPublicBaseSchema.pick({
  responseId: true,
  repoURL: true,
}).extend({
  repoURL: z.url().refine((val) => {
    try {
      const url = new URL(val);
      const allowedHosts = ["github.com", "www.github.com"];
      const path = url.pathname.split("/").filter(Boolean);

      return (
        url.protocol === "https:" &&
        allowedHosts.includes(url.hostname) &&
        path.length === 2 &&
        url.search === "" &&
        url.hash === ""
      );
    } catch {
      return false;
    }
  }, "Repo URL must follow the format: https://github.com/USER/REPO"),
});

export type TestResult = z.infer<typeof TestResultSchema>;
export type SuiteResult = z.infer<typeof SuiteResultSchema>;
export type GradingJobPublicBase = z.infer<typeof GradingJobPublicBaseSchema>;
export type GradingJobDataInternal = z.infer<
  typeof GradingJobDataInternalSchema
>;
