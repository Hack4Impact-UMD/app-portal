import { GradingJobStatus } from "@app-portal/shared/constants";
import { CheckCircle2, Circle, LoaderCircle, XCircle } from "lucide-react";

import { displayDurationMs, displayGradingJobStatus } from "@/utils/display";
import {
  gradingJobRunnableStatuses,
  isTerminalGradingJobStatus,
} from "@/utils/grading";

type StepDisplayStatus = "complete" | "active" | "pending" | "error";

type AutograderStepListProps = {
  status: GradingJobStatus;
  cloneDurationMs?: number;
  installDurationMs?: number;
  buildDurationMs?: number;
  testingDurationMs?: number;
  errorStep?: GradingJobStatus;
};

function getStepDisplayStatus(
  stepStatus: GradingJobStatus,
  currentStatus: GradingJobStatus,
  errorStep?: GradingJobStatus,
): StepDisplayStatus {
  if (isTerminalGradingJobStatus(currentStatus)) {
    if (errorStep !== undefined) {
      const stepIndex = gradingJobRunnableStatuses.indexOf(stepStatus);
      const errorIndex = gradingJobRunnableStatuses.indexOf(errorStep);
      if (stepIndex < errorIndex) return "complete";
      if (stepIndex === errorIndex) return "error";
      return "pending";
    }
    return "complete";
  }

  const stepIndex = gradingJobRunnableStatuses.indexOf(stepStatus);
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

function StepIcon({ displayStatus }: { displayStatus: StepDisplayStatus }) {
  if (displayStatus === "complete") {
    return <CheckCircle2 className="size-5 text-green-700" />;
  }

  if (displayStatus === "active") {
    return <LoaderCircle className="size-5 animate-spin text-blue" />;
  }

  if (displayStatus === "error") {
    return <XCircle className="size-5 text-red-600" />;
  }

  return <Circle className="size-5 text-muted-foreground" />;
}

export default function AutograderStepList({
  status,
  cloneDurationMs,
  installDurationMs,
  buildDurationMs,
  testingDurationMs,
  errorStep
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
          const displayStatus = getStepDisplayStatus(stepStatus, status, errorStep);
          const durationMs = getStepDuration(stepStatus, stepDurations);

          return (
            <div key={stepStatus} className="flex items-center gap-3 px-5 py-4">
              <StepIcon displayStatus={displayStatus} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">
                  {displayGradingJobStatus(stepStatus)}
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
