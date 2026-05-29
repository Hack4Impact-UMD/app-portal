import type { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

// TODO: we should do zod schemas to ensure typescript <-> firebase <-> golang conversions work as expected

export enum GradingJobStatus {
  Queued = "queued",
  Pending = "pending",
  Cloning = "cloning",
  Installing = "installing",
  Building = "building",
  Serving = "serving",
  Testing = "testing",
  Completed = "completed",
  Failed = "failed",
}

export interface TestResult {
  suite: string;
  testName: string;
  passed: boolean;
  stdout: string;
  stderr: string;
  errors: string[];
  durationMs: number;
  points: number;
}

export interface PublicTestResult {
  suiteName: string;
  passed: number;
  failed: number;
  total: number;
  durationMs: number;
  points: number;
  totalPoints: number;
}

export interface GradingJobPublic {
  id: string;
  responseId: string;
  repoURL: string;
  status: GradingJobStatus;
  score: number;
  totalTests: number;
  completedTests: number;
  error?: string;
  started: Timestamp;
  completed?: Timestamp;
  updated: Timestamp;
  publicTests: Record<string, PublicTestResult>;
}

export interface GradingJobDataInternal {
  id: string;
  testRepo: string;
  buildLog: string;
  installLog: string;
  playwrightLog: string;
  error?: string;
  tests: Record<string, TestResult[]>;
}

export const submitGradingJobSchema = z.object({
  responseId: z.string().nonempty(),
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
