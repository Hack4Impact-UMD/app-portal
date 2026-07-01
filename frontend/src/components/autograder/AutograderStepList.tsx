import { GradingJobStatus } from "@app-portal/shared/constants";

import AutograderExpandableRow from "@/components/autograder/AutograderExpandableRow";
import AutograderLogBlock from "@/components/autograder/AutograderLogBlock";
import type { AutograderStatusIconStatus } from "@/components/autograder/AutograderStatusIcon";
import { displayDurationMs, gradingJobStatusLabels } from "@/utils/display";
import { gradingJobRunnableStatuses } from "@/utils/grading";

type AutograderStepListProps = {
  status: GradingJobStatus;
  errorStep?: GradingJobStatus;
  logs?: Partial<Record<GradingJobStatus, string>>;
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

function displayStepStatus(status: AutograderStatusIconStatus) {
  return status[0].toUpperCase() + status.slice(1);
}

export default function AutograderStepList({
  status,
  errorStep,
  logs,
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
          const logOutput = logs?.[stepStatus];
          const stepStatusLabel = displayStepStatus(displayStatus);
          const subtitle =
            durationMs !== undefined
              ? `${stepStatusLabel} - ${displayDurationMs(durationMs)}`
              : stepStatusLabel;

          return (
            <AutograderExpandableRow
              key={stepStatus}
              className="px-5 py-4"
              status={displayStatus}
              title={gradingJobStatusLabels[stepStatus]}
              subtitle={subtitle}
            >
              {logOutput && <AutograderLogBlock output={logOutput} />}
            </AutograderExpandableRow>
          );
        })}
      </div>
    </section>
  );
}
