import type { GradingJobStatus } from "@app-portal/shared/constants";
import { Circle, CircleAlert, LoaderCircle } from "lucide-react";
import { useParams } from "react-router-dom";

import AutograderRunSummary from "@/components/autograder/AutograderRunSummary";
import Loading from "@/components/Loading";
import { useGradingJobSnapshot } from "@/hooks/useGrading";
import { displayGradingJobStatus, gradingJobEmoji } from "@/utils/display";
import {
  gradingJobRunnableStatuses,
  isTerminalGradingJobStatus,
} from "@/utils/grading";

type StepDisplayStatus = "complete" | "active" | "pending";

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

function StepIcon({
  stepStatus,
  displayStatus,
}: {
  stepStatus: GradingJobStatus;
  displayStatus: StepDisplayStatus;
}) {
  if (displayStatus === "complete") {
    return (
      <span
        aria-hidden
        className="flex size-7 items-center justify-center text-lg"
      >
        {gradingJobEmoji[stepStatus]}
      </span>
    );
  }

  if (displayStatus === "active") {
    return <LoaderCircle className="size-5 animate-spin text-blue" />;
  }

  return <Circle className="size-5 text-muted-foreground" />;
}

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

          <div className="flex flex-col gap-6">
            <section className="overflow-hidden rounded-md border bg-background shadow-xs">
              <div className="border-b bg-background px-5 py-4">
                <h2 className="text-lg font-semibold text-foreground">Steps</h2>
              </div>

              <div className="divide-y">
                {gradingJobRunnableStatuses.map((stepStatus) => {
                  const displayStatus = getStepDisplayStatus(
                    stepStatus,
                    job.status,
                  );

                  return (
                    <div
                      key={stepStatus}
                      className="flex items-center gap-3 px-5 py-4"
                    >
                      <StepIcon
                        stepStatus={stepStatus}
                        displayStatus={displayStatus}
                      />
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
        </div>
      </div>
    </main>
  );
}
