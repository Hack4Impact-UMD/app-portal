import { CircleAlert } from "lucide-react";
import { useParams } from "react-router-dom";

import AutograderPublicTestResults from "@/components/autograder/AutograderPublicTestResults";
import AutograderRunSummary from "@/components/autograder/AutograderRunSummary";
import AutograderStepList from "@/components/autograder/AutograderStepList";
import Loading from "@/components/Loading";
import { useGradingJobSnapshot } from "@/hooks/useGrading";
import { displayGradingJobStatus, gradingJobEmoji } from "@/utils/display";
import { isTerminalGradingJobStatus } from "@/utils/grading";
import { useMemo } from "react";

export default function AutograderRunPage() {
  const { jobId } = useParams();
  const { data: job, isPending, error } = useGradingJobSnapshot(jobId);
  const maxScore = useMemo(() => Object.values(job?.suiteResults ?? {}).reduce((acc, v) => acc + v.totalPoints, 0), [job])

  if (isPending) {
    return <Loading />;
  }

  if (error || !job) {
    return (
      <main className="flex h-screen flex-col items-center justify-center bg-muted p-8 text-center">
        <CircleAlert className="mb-4 size-12 text-destructive" />
        <h1 className="text-3xl font-semibold text-foreground">
          Failed to load autograder job! ID: {jobId}
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          {error?.message ??
            "The requested autograder job could not be loaded."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted px-8 pb-12 pt-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Autograder</span>
              <span>/</span>
              <span className="break-all font-mono">{job.id}</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-foreground">
              Autograder Run
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-xs">
            <span>Status: </span>
            {displayGradingJobStatus(job.status)}
            <span aria-hidden>{gradingJobEmoji[job.status]}</span>
          </div>
        </header>

        <div className="grid grid-cols-[20rem_minmax(0,1fr)] gap-6">
          <AutograderRunSummary
            status={job.status}
            score={job.score}
            repoURL={job.repoURL}
            jobId={job.id}
            responseId={job.responseId}
            started={job.started}
            updated={job.updated}
            maxScore={maxScore}
            durationMs={job.updated.toMillis() - job.started.toMillis()}
          />

          <div className="flex flex-col gap-6">
            <AutograderStepList
              status={job.status}
              cloneDurationMs={job.cloneDurationMs}
              installDurationMs={job.installDurationMs}
              buildDurationMs={job.buildDurationMs}
              testingDurationMs={job.testingDurationMs}
              errorStep={job.errorStep}
            />

            <AutograderPublicTestResults
              suiteResults={job.suiteResults}
              tests={job.publicTests}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
