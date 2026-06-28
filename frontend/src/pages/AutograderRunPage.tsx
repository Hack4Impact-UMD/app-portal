import { CircleAlert } from "lucide-react";
import { useParams } from "react-router-dom";

import AutograderRunSummary from "@/components/autograder/AutograderRunSummary";
import AutograderStepList from "@/components/autograder/AutograderStepList";
import Loading from "@/components/Loading";
import { useGradingJobSnapshot } from "@/hooks/useGrading";
import { displayGradingJobStatus, gradingJobEmoji } from "@/utils/display";

export default function AutograderRunPage() {
  const { jobId } = useParams();
  const {
    data: job,
    isPending,
    error,
    notFound,
  } = useGradingJobSnapshot(jobId);

  if (isPending) {
    return <Loading />;
  }

  if (error) {
    return (
      <main className="flex h-screen flex-col items-center justify-center bg-muted p-8 text-center">
        <CircleAlert className="mb-4 size-12 text-destructive" />
        <h1 className="text-3xl font-semibold text-foreground">
          Failed to load autograder job! ID: {jobId}
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">{error.message}</p>
      </main>
    );
  }

  if (notFound || !job) {
    return (
      <main className="flex h-screen flex-col items-center justify-center bg-muted p-8 text-center">
        <CircleAlert className="mb-4 size-12 text-destructive" />
        <h1 className="text-3xl font-semibold text-foreground">
          Autograder job not found! Id: {jobId}
        </h1>
        <p className="mt-2 text-muted-foreground">
          The requested autograder job {jobId} does not exist.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted px-8 py-6">
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
          />

          <AutograderStepList status={job.status} />
        </div>
      </div>
    </main>
  );
}
