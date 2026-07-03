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

const githubRepoUrlPattern =
  /^(https:\/\/)?github\.com\/([^/\s]+)\/([^/\s]+?)\/?$/i;

export function isValidGithubRepoUrl(url: string): boolean {
  return githubRepoUrlPattern.test(url.trim());
}

// extracts the "{user}/{repo}" path from a github repo URL, or null if the
// URL doesn't match the expected github.com repo format
export function extractGithubRepoPath(url: string): string | null {
  const match = githubRepoUrlPattern.exec(url.trim());
  if (!match) return null;

  return `${match[2]}/${match[3]}`;
}
