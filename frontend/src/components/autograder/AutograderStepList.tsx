import type { GradingJobStatus } from "@app-portal/shared/constants";
import { CheckCircle2, Circle, LoaderCircle } from "lucide-react";

import { displayGradingJobStatus } from "@/utils/display";
import {
  gradingJobRunnableStatuses,
  isTerminalGradingJobStatus,
} from "@/utils/grading";

type StepDisplayStatus = "complete" | "active" | "pending";

type AutograderStepListProps = {
  status: GradingJobStatus;
};

function getStepDisplayStatus(
  stepStatus: GradingJobStatus,
  currentStatus: GradingJobStatus,
): StepDisplayStatus {
  if (isTerminalGradingJobStatus(currentStatus)) return "complete";

  const stepIndex = gradingJobRunnableStatuses.indexOf(stepStatus);
  const currentIndex = gradingJobRunnableStatuses.indexOf(currentStatus);

  if (stepIndex < currentIndex) return "complete";
  if (stepIndex === currentIndex) return "active";
  return "pending";
}

function StepIcon({ displayStatus }: { displayStatus: StepDisplayStatus }) {
  if (displayStatus === "complete") {
    return <CheckCircle2 className="size-5 text-green-700" />;
  }

  if (displayStatus === "active") {
    return <LoaderCircle className="size-5 animate-spin text-blue" />;
  }

  return <Circle className="size-5 text-muted-foreground" />;
}

export default function AutograderStepList({
  status,
}: AutograderStepListProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-md border bg-background shadow-xs">
        <div className="border-b bg-background px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">Steps</h2>
        </div>

        <div className="divide-y">
          {gradingJobRunnableStatuses.map((stepStatus) => {
            const displayStatus = getStepDisplayStatus(stepStatus, status);

            return (
              <div
                key={stepStatus}
                className="flex items-center gap-3 px-5 py-4"
              >
                <StepIcon displayStatus={displayStatus} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">
                    {displayGradingJobStatus(stepStatus)}
                  </p>
                  <p className="text-sm capitalize text-muted-foreground">
                    {displayStatus}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
