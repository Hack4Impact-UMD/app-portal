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
  durationMs: z.int().nonnegative(),
  points: z.int().nonnegative(),
});

export const SuiteResultSchema = z.object({
  suiteName: z.string().nonempty(),
  passed: z.int().nonnegative(),
  failed: z.int().nonnegative(),
  total: z.int().nonnegative(), // number of tests
  durationMs: z.int().nonnegative(),
  points: z.int().nonnegative(),
  totalPoints: z.int().nonnegative(),
});

export const PublicTestsSchema = z.record(
  z.string(),
  z.record(z.string(), TestResultSchema),
);

export const SuiteResultsSchema = z.record(z.string(), SuiteResultSchema);

// ⚠️ should not be used on its own!!!!
// use the per-package extension schema with Timestamp!!!!
export const GradingJobPublicBaseSchema = z.object({
  id: z.string().nonempty(),
  responseId: z.string().nonempty(),
  repoURL: z.string().nonempty(),
  status: z.enum(GradingJobStatus),
  score: z.float64().nonnegative(),
  totalTests: z.int().nonnegative(),
  completedTests: z.int().nonnegative(),
  error: z.string().optional(),
  cloneDurationMs: z.int().nonnegative().optional(),
  installDurationMs: z.int().nonnegative().optional(),
  buildDurationMs: z.int().nonnegative().optional(),
  testingDurationMs: z.int().nonnegative().optional(),
  suiteResults: SuiteResultsSchema,
  publicTests: PublicTestsSchema,
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
});

export type TestResult = z.infer<typeof TestResultSchema>;
export type SuiteResult = z.infer<typeof SuiteResultSchema>;
export type PublicTests = z.infer<typeof PublicTestsSchema>;
export type SuiteResults = z.infer<typeof SuiteResultsSchema>;
export type GradingJobPublicBase = z.infer<typeof GradingJobPublicBaseSchema>;
export type GradingJobDataInternal = z.infer<
  typeof GradingJobDataInternalSchema
>;
