import { GradingJobStatus } from "@app-portal/shared/constants";

export const gradingJobTerminalStatuses = [
  GradingJobStatus.Completed,
  GradingJobStatus.Failed,
];

export const gradingJobRunnableStatuses = Object.values(
  GradingJobStatus,
).filter((status) => !gradingJobTerminalStatuses.includes(status));

export function isTerminalGradingJobStatus(status: GradingJobStatus) {
  return gradingJobTerminalStatuses.includes(status);
}
