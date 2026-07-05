import { GradingJobStatus } from "@app-portal/shared/constants";

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
  /^(https:\/\/)?github\.com\/([^/\s]+)\/([^/\s]+?)\/?$/i;

// extracts the "{user}/{repo}" path from a github repo URL, or null if the
// URL doesn't match the expected github.com repo format
export function extractGithubRepoPath(url: string): string | null {
  const match = githubRepoUrlPattern.exec(url.trim());
  if (!match) return null;

  return `${match[2]}/${match[3]}`;
}
