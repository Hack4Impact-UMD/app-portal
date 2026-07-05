import { GradingJobStatus } from "@app-portal/shared/constants";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  FolderGit2,
  Timer,
} from "lucide-react";
import { Link } from "react-router-dom";

import AutograderStatusIcon from "@/components/autograder/AutograderStatusIcon";
import Spinner from "@/components/Spinner";
import { useGradingJobSnapshot } from "@/hooks/useGrading";
import { cn } from "@/lib/utils";
import { displayTimestamp } from "@/utils/dates";
import {
  displayDurationMs,
  getGradingJobMaxScore,
  gradingJobStatusLabels,
} from "@/utils/display";
import { isTerminalGradingJobStatus } from "@/utils/grading";

type AutograderJobCardProps = {
  jobId: string;
  header?: string;
  className?: string;
};
export default function AutograderJobCard({
  jobId,
  className,
  header,
}: AutograderJobCardProps) {
  const { data: job, isPending, error } = useGradingJobSnapshot(jobId);

  if (isPending) {
    return (
      <div
        className={cn(
          "flex h-26 items-center justify-center rounded border bg-white",
          className,
        )}
      >
        <Spinner />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div
        className={cn(
          "flex h-26 items-center justify-center rounded border bg-white px-3 text-center text-sm text-destructive",
          className,
        )}
      >
        {error?.message ?? "Failed to load autograder job."}
      </div>
    );
  }

  const finished = isTerminalGradingJobStatus(job.status);
  const failed = job.status === GradingJobStatus.Failed;
  const iconStatus = failed ? "failed" : finished ? "complete" : "active";
  const maxScore = getGradingJobMaxScore(job);
  const elapsedMs = job.updated.toMillis() - job.started.toMillis();
  const cardClass = failed
    ? "border-destructive/30 bg-destructive/10 hover:bg-destructive/15"
    : finished
      ? "border-green-600/30 bg-green-50/80 hover:bg-green-100"
      : "border-blue/25 bg-blue/5 hover:bg-blue/10";
  const detailsClass = failed
    ? "text-destructive"
    : finished
      ? "text-green-700"
      : "text-blue";
  const metadataClass = failed
    ? "bg-background/70 text-destructive"
    : finished
      ? "bg-background/70 text-green-800"
      : "bg-background/70 text-muted-foreground";

  return (
    <Link
      to={`/autograder/${job.id}`}
      target="_blank"
      rel="noreferrer"
      title={job.id}
      className={cn(
        "flex flex-col justify-center gap-2 rounded-md border p-4 shadow-xs transition hover:shadow-sm",
        cardClass,
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {header && (
          <span className="truncate text-base font-semibold text-foreground">
            {header}
          </span>
        )}

        <span
          className={cn(
            "ml-auto flex shrink-0 items-center gap-0.5 text-xs",
            detailsClass,
          )}
        >
          Details
          <ChevronRight className="size-3" />
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
          <AutograderStatusIcon
            status={iconStatus}
            className="size-4 shrink-0"
          />
          <span className="truncate">{gradingJobStatusLabels[job.status]}</span>
        </span>

        {failed ? (
          <span className="shrink-0 text-2xl font-semibold text-destructive">
            Failed
          </span>
        ) : (
          <span
            className={cn(
              "shrink-0 text-2xl font-semibold",
              finished ? detailsClass : "text-muted-foreground",
            )}
          >
            {job.score}
            <span className="text-sm font-normal text-muted-foreground">
              /{maxScore}
            </span>
          </span>
        )}
      </div>

      <div className={cn("space-y-1 rounded-md px-2.5 py-2", metadataClass)}>
        <div className="flex min-w-0 items-center gap-1.5 text-xs">
          <FolderGit2 className="size-3 shrink-0" />
          <span className="truncate">{job.repoURL}</span>
        </div>

        <div className="flex min-w-0 items-center gap-1.5 text-xs">
          <Clock className="size-3 shrink-0" />
          <span className="truncate">{displayTimestamp(job.started)}</span>
          <span aria-hidden>·</span>
          <Timer className="size-3 shrink-0" />
          <span className="truncate">{displayDurationMs(elapsedMs)}</span>
        </div>
      </div>

      {failed && job.errorStep && (
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="size-3 shrink-0" />
          <span className="truncate">
            Failed at stage: {gradingJobStatusLabels[job.errorStep]}
          </span>
        </div>
      )}
    </Link>
  );
}
