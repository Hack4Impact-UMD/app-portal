import { GradingJobStatus } from "@app-portal/shared/constants";

import type { GradingJobPublic } from "@/types/types";
import { getGradingJobMaxScore } from "@/utils/display";

const gradingJobTerminalStatuses = [
  GradingJobStatus.Completed,
  GradingJobStatus.Failed,
];

export const gradingJobRunnableStatuses = Object.values(
  GradingJobStatus,
).filter((status) => !gradingJobTerminalStatuses.includes(status));

export function isTerminalGradingJobStatus(status: GradingJobStatus) {
  return gradingJobTerminalStatuses.includes(status);
}

export type GradingJobStatusBucket =
  | "queued"
  | "running"
  | "completed"
  | "failed";

// Collapses the fine-grained grading statuses into the four coarse buckets used
// by the dashboard's filter buttons. Everything between queued and terminal
// (cloning, installing, building, serving, testing, pending) counts as running.
export function gradingJobStatusBucket(
  status: GradingJobStatus,
): GradingJobStatusBucket {
  switch (status) {
    case GradingJobStatus.Queued:
      return "queued";
    case GradingJobStatus.Completed:
      return "completed";
    case GradingJobStatus.Failed:
      return "failed";
    default:
      return "running";
  }
}

const githubRepoUrlPattern =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?(?:\/.*)?$/i;

// extracts the "{user}/{repo}" path from a github repo URL, or null if the
// URL doesn't match the expected github.com repo format. Tolerates http(s),
// a "www." prefix, a trailing ".git", and extra path segments (e.g. /tree/main).
export function extractGithubRepoPath(url: string): string | null {
  const match = githubRepoUrlPattern.exec(url.trim());
  if (!match) return null;

  return `${match[1]}/${match[2]}`;
}

export function pickBestGradingJob(
  jobs: GradingJobPublic[],
): GradingJobPublic | null {
  let best: GradingJobPublic | null = null;
  let bestScore = -1;

  for (const job of jobs) {
    const maxScore = getGradingJobMaxScore(job);
    if (maxScore <= 0) continue;

    const score = job.score / maxScore;
    if (score > bestScore) {
      bestScore = score;
      best = job;
    }
  }

  return best ?? jobs[0] ?? null;
}

export function buildRepoCloneCommand(repoPath: string) {
  return `git clone https://$GITHUB_PAT@github.com/${repoPath}.git`;
}
