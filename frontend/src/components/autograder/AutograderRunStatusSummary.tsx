import { GradingJobStatus } from "@app-portal/shared/constants";
import type { Timestamp } from "firebase/firestore";

import AutograderStatusIcon from "@/components/autograder/AutograderStatusIcon";
import { Progress } from "@/components/ui/progress";
import { displayTimestamp } from "@/utils/dates";
import { gradingJobStatusLabels } from "@/utils/display";
import { isTerminalGradingJobStatus } from "@/utils/grading";

type AutograderRunStatusSummaryProps = {
  status: GradingJobStatus;
  score: number;
  started: Timestamp;
  updated: Timestamp;
};

function RunStatus({ status }: { status: GradingJobStatus }) {
  const completed = status === GradingJobStatus.Completed;
  const failed = status === GradingJobStatus.Failed;
  const iconStatus = completed ? "complete" : failed ? "failed" : "active";

  return (
    <div>
      <dt className="text-muted-foreground">Run status</dt>
      <dd className="mt-1">
        <div className="flex items-center gap-2 font-medium text-foreground">
          {isTerminalGradingJobStatus(status)
            ? gradingJobStatusLabels[status]
            : "Autograder running"}
          <AutograderStatusIcon
            status={iconStatus}
            className="size-4 shrink-0"
          />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {completed
            ? "The run finished successfully."
            : failed
              ? "The run ended before producing a successful result."
              : "This page will update automatically as each step finishes."}
        </p>
      </dd>
    </div>
  );
}

export default function AutograderRunStatusSummary({
  status,
  score,
  started,
  updated,
}: AutograderRunStatusSummaryProps) {
  const finished = isTerminalGradingJobStatus(status);

  return (
    <section className="rounded-md border bg-background p-3 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Summary</h2>
      </div>

      <div className="mt-3 space-y-3">
        <dl className="text-sm">
          <RunStatus status={status} />
        </dl>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall score</span>
            <span className="font-medium">{finished ? score : "Pending"}</span>
          </div>
          <Progress value={finished ? score : 0} />
        </div>

        <dl className="space-y-2.5 text-sm">
          <div>
            <dt className="text-muted-foreground">Started</dt>
            <dd className="mt-1 font-medium text-foreground">
              {displayTimestamp(started)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last updated</dt>
            <dd className="mt-1 font-medium text-foreground">
              {displayTimestamp(updated)}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
