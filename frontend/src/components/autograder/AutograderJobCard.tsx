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

  return (
    <Link
      to={`/autograder/${job.id}`}
      target="_blank"
      rel="noreferrer"
      title={job.id}
      className={cn(
        "flex flex-col justify-center rounded border bg-white p-3 hover:bg-muted",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {header && (
          <span className="truncate text-sm font-semibold text-foreground">
            {header}
          </span>
        )}

        <span className="text-blue ml-auto flex shrink-0 items-center gap-0.5 text-xs">
          Details
          <ChevronRight className="size-3" />
        </span>
      </div>

      <div className="flex items-center justify-between">
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
              finished ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {job.score}
            <span className="text-sm font-normal text-muted-foreground">
              /{maxScore}
            </span>
          </span>
        )}
      </div>

      <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <FolderGit2 className="size-3 shrink-0" />
        <span className="truncate">{job.repoURL}</span>
      </div>

      <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="size-3 shrink-0" />
        <span className="truncate">{displayTimestamp(job.started)}</span>
        <span aria-hidden>·</span>
        <Timer className="size-3 shrink-0" />
        <span className="truncate">{displayDurationMs(elapsedMs)}</span>
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
