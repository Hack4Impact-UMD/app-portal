import { z } from "zod";

import { GradingJobStatus } from "../constants/index.js";

// Matches a GitHub "owner/repo" path using only characters GitHub allows in
// owner and repo names, rejecting shell metacharacters and path traversal.
const githubRepoPathPattern =
  /^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,99})\/[A-Za-z0-9](?:[A-Za-z0-9._-]{0,99})$/;

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

export const TestsSchema = z.record(
  z.string(),
  z.record(z.string(), TestResultSchema),
);

export const SuiteResultsSchema = z.record(z.string(), SuiteResultSchema);

// ⚠️ should not be used on its own!!!!
// use the per-package extension schema with Timestamp!!!!
export const GradingJobPublicBaseSchema = z.object({
  id: z.string().nonempty(),
  responseId: z.string().nonempty(),
  repoURL: z.string().nonempty(), // stored as "owner/repo" GitHub path, not a full URL
  status: z.enum(GradingJobStatus),
  score: z.float64().nonnegative(),
  totalTests: z.int().nonnegative(),
  completedTests: z.int().nonnegative(),
  error: z.string().optional(),
  errorStep: z.enum(GradingJobStatus).optional(),
  cloneDurationMs: z.int().nonnegative().optional(),
  installDurationMs: z.int().nonnegative().optional(),
  buildDurationMs: z.int().nonnegative().optional(),
  testingDurationMs: z.int().nonnegative().optional(),
  suiteResults: SuiteResultsSchema,
  publicTests: TestsSchema,
});

export const GradingJobDataInternalSchema = z.object({
  id: z.string().nonempty(),
  testRepo: z.string().nonempty(),
  buildLog: z.string(),
  installLog: z.string(),
  playwrightLog: z.string(),
  error: z.string().optional(),
  tests: TestsSchema,
});

export const submitGradingJobSchema = GradingJobPublicBaseSchema.pick({
  responseId: true,
  repoURL: true,
}).extend({
  repoURL: z
    .string()
    .regex(githubRepoPathPattern, "Repository must be in owner/repo format"),
});

// Standalone grading job: grade an arbitrary assessment repo against a test
// repo, with no application response attached. repoURL is the assessment repo
// to grade; testRepo is the repo containing the tests to run against it.
export const submitStandaloneGradingJobSchema = z.object({
  repoURL: z
    .string()
    .regex(githubRepoPathPattern, "Repository must be in owner/repo format"),
  testRepo: z
    .string()
    .regex(githubRepoPathPattern, "Repository must be in owner/repo format"),
});

export type TestResult = z.infer<typeof TestResultSchema>;
export type SuiteResult = z.infer<typeof SuiteResultSchema>;
export type Tests = z.infer<typeof TestsSchema>;
export type SuiteResults = z.infer<typeof SuiteResultsSchema>;
export type GradingJobPublicBase = z.infer<typeof GradingJobPublicBaseSchema>;
export type GradingJobDataInternal = z.infer<
  typeof GradingJobDataInternalSchema
>;
