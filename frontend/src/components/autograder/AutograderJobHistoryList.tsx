import { GradingJobStatus } from "@app-portal/shared/constants";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AutograderStatusIcon from "@/components/autograder/AutograderStatusIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useJobsForApplicationResponse } from "@/hooks/useGrading";
import { displayTimestamp } from "@/utils/dates";
import { getGradingJobMaxScore } from "@/utils/display";
import { isTerminalGradingJobStatus } from "@/utils/grading";

type AutograderJobHistoryListProps = {
  responseId: string;
  currentJobId: string;
};

type SortOption = "recent" | "score";

export default function AutograderJobHistoryList({
  responseId,
  currentJobId,
}: AutograderJobHistoryListProps) {
  const {
    data: jobs,
    isPending,
    error,
  } = useJobsForApplicationResponse(responseId);
  const [sortOption, setSortOption] = useState<SortOption>("recent");

  const sortedJobs = useMemo(() => {
    if (!jobs) return jobs;
    return [...jobs].sort((a, b) =>
      sortOption === "score"
        ? b.score - a.score
        : b.started.toMillis() - a.started.toMillis(),
    );
  }, [jobs, sortOption]);

  return (
    <section className="rounded-md border bg-background p-3 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">Job History</h2>
        <Select
          value={sortOption}
          onValueChange={(value) => setSortOption(value as SortOption)}
        >
          <SelectTrigger size="sm" className="text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="score">Highest score</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isPending && (
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      )}

      {error && (
        <p className="mt-2 text-sm text-destructive">
          Failed to load job history.
        </p>
      )}

      {sortedJobs && sortedJobs.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">No previous runs.</p>
      )}

      {sortedJobs && sortedJobs.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 max-h-64 overflow-y-scroll">
          {sortedJobs.map((job) => {
            const finished = isTerminalGradingJobStatus(job.status);
            const failed = job.status === GradingJobStatus.Failed;
            const iconStatus = failed
              ? "failed"
              : finished
                ? "complete"
                : "active";
            const maxScore = getGradingJobMaxScore(job);

            return (
              <li key={job.id}>
                <Link
                  to={`/autograder/${job.id}`}
                  className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted ${
                    job.id === currentJobId
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <AutograderStatusIcon
                      status={iconStatus}
                      className="size-3.5 shrink-0"
                    />
                    <span className="truncate">
                      {displayTimestamp(job.started)}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-xs">
                    {failed
                      ? "Failed"
                      : finished
                        ? `${job.score}/${maxScore}`
                        : "..."}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
