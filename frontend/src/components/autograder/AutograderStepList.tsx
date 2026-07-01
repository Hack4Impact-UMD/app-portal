import { GradingJobStatus } from "@app-portal/shared/constants";

import type { AutograderStatusIconStatus } from "@/components/autograder/AutograderStatusIcon";
import AutograderStatusIcon from "@/components/autograder/AutograderStatusIcon";
import { displayDurationMs, gradingJobStatusLabels } from "@/utils/display";
import { gradingJobRunnableStatuses } from "@/utils/grading";

type AutograderStepListProps = {
  status: GradingJobStatus;
  errorStep?: GradingJobStatus;
  cloneDurationMs?: number;
  installDurationMs?: number;
  buildDurationMs?: number;
  testingDurationMs?: number;
};

function getStepDisplayStatus(
  stepStatus: GradingJobStatus,
  currentStatus: GradingJobStatus,
  errorStep?: GradingJobStatus,
): AutograderStatusIconStatus {
  if (currentStatus === GradingJobStatus.Completed) return "complete";

  const stepIndex = gradingJobRunnableStatuses.indexOf(stepStatus);

  if (currentStatus === GradingJobStatus.Failed) {
    const errorStepIndex = errorStep
      ? gradingJobRunnableStatuses.indexOf(errorStep)
      : -1;

    if (stepIndex < errorStepIndex) return "complete";
    if (stepIndex === errorStepIndex) return "failed";
    return "pending";
  }

  const currentIndex = gradingJobRunnableStatuses.indexOf(currentStatus);
  if (stepIndex < currentIndex) return "complete";
  if (stepIndex === currentIndex) return "active";
  return "pending";
}

function getStepDuration(
  stepStatus: GradingJobStatus,
  durations: Partial<Record<GradingJobStatus, number>>,
) {
  return durations[stepStatus];
}

export default function AutograderStepList({
  status,
  errorStep,
  cloneDurationMs,
  installDurationMs,
  buildDurationMs,
  testingDurationMs,
}: AutograderStepListProps) {
  const stepDurations = {
    [GradingJobStatus.Cloning]: cloneDurationMs,
    [GradingJobStatus.Installing]: installDurationMs,
    [GradingJobStatus.Building]: buildDurationMs,
    [GradingJobStatus.Testing]: testingDurationMs,
  };

  return (
    <section className="overflow-hidden rounded-md border bg-background shadow-xs">
      <div className="border-b bg-background px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">Steps</h2>
      </div>

      <div className="divide-y">
        {gradingJobRunnableStatuses.map((stepStatus) => {
          const displayStatus = getStepDisplayStatus(
            stepStatus,
            status,
            errorStep,
          );
          const durationMs = getStepDuration(stepStatus, stepDurations);

          return (
            <div key={stepStatus} className="flex items-center gap-3 px-5 py-4">
              <AutograderStatusIcon status={displayStatus} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">
                  {gradingJobStatusLabels[stepStatus]}
                </p>
                <p className="text-sm capitalize text-muted-foreground">
                  {displayStatus}
                  {durationMs !== undefined
                    ? ` - ${displayDurationMs(durationMs)}`
                    : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
